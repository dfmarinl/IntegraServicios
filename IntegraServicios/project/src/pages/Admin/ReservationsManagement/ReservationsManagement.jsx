import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import {
  getReservationDashboardApi,
  getAllReservationsWithDetailsApi,
  getReservationDetailsApi,
  updateReservationApi,
  deleteReservationApi,
  manageRepeatSeriesApi,
  searchReservationsApi,
  generateReservationsReportApi,
  bulkUpdateReservationsApi,
  formatDateRangeForReport,
  validateSearchFilters,
  calculateQuickStats,
  generateExportFilename,
  downloadFile,
  prepareReservationsForCSV,
} from "../../../api/Reservation/reservationManagementApi";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import GenericDeleteModal from "../../../modals/GenericDeletemodal/GenericDeleteModal";
import ReservationDetailsModal from "../../../modals/ReservationDetailsModal/ReservationDetailsModal";
import EditReservationModal from "../../../modals/EditReservationModal/EditReservationModal";
import ManageRepeatSeriesModal from "../../../modals/ManageRepeatSeriesModal/ManageRepeatSeriesModal";
import SearchReservationsModal from "../../../modals/SearchReservationsModal/SearchReservationsModal";
import GenerateReportModal from "../../../modals/GenerateReportModal/GenerateReportModal";
import BulkActionsModal from "../../../modals/BulkActionsModal/BulkActionsModal";
import "./ReservationsManagement.css";

const ReservationsManagement = () => {
  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para selección y detalles
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedReservations, setSelectedReservations] = useState([]);

  // Estados para filtros y paginación
  const [filters, setFilters] = useState({
    status: "all",
    unitId: "",
    resourceId: "",
    userId: "",
    isRepetitive: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Estados para modales
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isManageSeriesModalOpen, setIsManageSeriesModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);

  // Estados para operaciones
  const [operationLoading, setOperationLoading] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState({});
  const [stats, setStats] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadDashboard();
    loadReservations();
  }, [currentPage, filters]);

  const loadDashboard = async () => {
    try {
      const dashboard = await getReservationDashboardApi({
        startDate: filters.startDate,
        endDate: filters.endDate,
        unitId: filters.unitId,
      });
      setDashboardData(dashboard.dashboard);
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
    }
  };

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllReservationsWithDetailsApi({
        ...filters,
        page: currentPage,
        limit: limit,
      });

      setReservations(response.reservations);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);

      // Calcular estadísticas rápidas
      const quickStats = calculateQuickStats(response.reservations);
      setStats(quickStats);
    } catch (err) {
      console.error("Error al cargar reservas:", err);
      setError(err.message || "Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  // Manejar detalles de reserva
  const handleViewDetails = async (reservation) => {
    try {
      setOperationLoading(true);
      const details = await getReservationDetailsApi(reservation.id);
      setSelectedReservation(details.reservation);
      setIsDetailsModalOpen(true);
    } catch (err) {
      setError(err.message || "Error al cargar detalles");
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar edición de reserva
  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setIsEditModalOpen(true);
  };

  // Manejar eliminación de reserva
  const handleDeleteClick = (reservation) => {
    setSelectedReservation(reservation);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación
  const handleDeleteConfirm = async () => {
    try {
      setOperationLoading(true);
      await deleteReservationApi(selectedReservation.id);
      setIsDeleteModalOpen(false);
      setSelectedReservation(null);
      loadReservations();
      loadDashboard();
    } catch (err) {
      setError(err.message || "Error al eliminar reserva");
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar gestión de series repetitivas
  const handleManageSeries = (reservation) => {
    if (reservation.isRepetitive) {
      setSelectedReservation(reservation);
      setIsManageSeriesModalOpen(true);
    }
  };

  // Confirmar gestión de serie
  const handleManageSeriesConfirm = async (action, config) => {
    try {
      setOperationLoading(true);
      const seriesId = selectedReservation.purpose; // Usamos purpose como ID de serie
      await manageRepeatSeriesApi(seriesId, action, config);
      setIsManageSeriesModalOpen(false);
      setSelectedReservation(null);
      loadReservations();
    } catch (err) {
      setError(err.message || "Error al gestionar serie");
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar búsqueda avanzada
  const handleSearchSubmit = async (criteria) => {
    try {
      setLoading(true);
      setSearchCriteria(criteria);

      const results = await searchReservationsApi(criteria);
      setReservations(results.reservations);
      setTotalItems(results.count);
      setTotalPages(1); // La búsqueda no usa paginación

      setIsSearchModalOpen(false);
    } catch (err) {
      setError(err.message || "Error en búsqueda");
    } finally {
      setLoading(false);
    }
  };

  // Manejar generación de reportes
  const handleGenerateReport = async (reportConfig) => {
    try {
      setOperationLoading(true);

      const report = await generateReservationsReportApi(reportConfig);

      if (reportConfig.format === "csv") {
        const filename = generateExportFilename("reporte_reservas", "csv");
        downloadFile(report, filename, "text/csv");
      } else if (reportConfig.format === "pdf") {
        const filename = generateExportFilename("reporte_reservas", "pdf");
        downloadFile(report, filename, "application/pdf");
      } else {
        // Para JSON, podrías mostrar un modal con el reporte
        console.log("Reporte generado:", report);
      }

      setIsReportModalOpen(false);
    } catch (err) {
      setError(err.message || "Error al generar reporte");
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar acciones masivas
  const handleBulkAction = async (action, updates) => {
    try {
      setOperationLoading(true);

      if (action === "update" && selectedReservations.length > 0) {
        await bulkUpdateReservationsApi(
          selectedReservations.map((r) => r.id),
          updates
        );
      }

      setIsBulkActionsModalOpen(false);
      setSelectedReservations([]);
      loadReservations();
      loadDashboard();
    } catch (err) {
      setError(err.message || "Error en acción masiva");
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar selección de reservas
  const handleSelectReservation = (reservation) => {
    const isSelected = selectedReservations.some(
      (r) => r.id === reservation.id
    );
    if (isSelected) {
      setSelectedReservations(
        selectedReservations.filter((r) => r.id !== reservation.id)
      );
    } else {
      setSelectedReservations([...selectedReservations, reservation]);
    }
  };

  const handleSelectAll = () => {
    if (selectedReservations.length === reservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations([...reservations]);
    }
  };

  // Manejar cambios de filtro
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      unitId: "",
      resourceId: "",
      userId: "",
      isRepetitive: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  // Función para obtener el nombre de display de la reserva
  const getReservationDisplayName = (reservation) => {
    if (!reservation) return "reserva";
    return `${reservation.Resource?.name || "Recurso"} - ${new Date(
      reservation.startDateTime
    ).toLocaleDateString()}`;
  };

  // Cards del dashboard
  const dashboardCards = dashboardData
    ? [
        {
          title: "Total Reservas",
          value: dashboardData.summary.totalReservations,
          icon: "📊",
          color: "#2563eb",
          description: "En el período seleccionado",
        },
        {
          title: "Pendientes",
          value: dashboardData.summary.byStatus.pendiente || 0,
          icon: "⏳",
          color: "#f59e0b",
          description: "Esperando confirmación",
        },
        {
          title: "Activas",
          value: dashboardData.summary.byStatus.activa || 0,
          icon: "✅",
          color: "#10b981",
          description: "En curso actualmente",
        },
        {
          title: "Repetitivas",
          value: stats?.repetitiveCount || 0,
          icon: "🔄",
          color: "#8b5cf6",
          description: "Series programadas",
        },
      ]
    : [];

  const actionCards = [
    {
      title: "Búsqueda Avanzada",
      description: "Buscar reservas con múltiples criterios",
      icon: "🔍",
      onClick: () => setIsSearchModalOpen(true),
      color: "#3b82f6",
    },
    {
      title: "Generar Reporte",
      description: "Exportar datos en diferentes formatos",
      icon: "📋",
      onClick: () => setIsReportModalOpen(true),
      color: "#10b981",
    },
    {
      title: "Acciones Masivas",
      description: "Actualizar múltiples reservas",
      icon: "⚡",
      onClick: () => setIsBulkActionsModalOpen(true),
      color: "#f59e0b",
      disabled: selectedReservations.length === 0,
    },
  ];

  // Función para renderizar el estado con colores
  const renderStatusBadge = (status) => {
    const statusConfig = {
      pendiente: { label: "Pendiente", color: "#f59e0b", bg: "#fef3c7" },
      activa: { label: "Activa", color: "#10b981", bg: "#d1fae5" },
      finalizada: { label: "Finalizada", color: "#6b7280", bg: "#f3f4f6" },
      cancelada: { label: "Cancelada", color: "#ef4444", bg: "#fee2e2" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "#6b7280",
      bg: "#f3f4f6",
    };

    return (
      <span
        className="status-badge"
        style={{
          color: config.color,
          backgroundColor: config.bg,
          borderColor: config.color,
        }}
      >
        {config.label}
      </span>
    );
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando reservas...</p>
      </div>
    );
  }

  return (
    <div className="reservations-management">
      <div className="page-header">
        <h1 className="page-title">Gestión de Reservas</h1>
        <p className="page-subtitle">
          Administra todas las reservas del sistema
        </p>
      </div>

      {/* Dashboard */}
      <div className="dashboard-section">
        <h2>Resumen</h2>
        <div className="stats-grid">
          {dashboardCards.map((stat) => (
            <Card key={stat.title} className="stat-card">
              <div className="stat-content">
                <div
                  className="stat-icon"
                  style={{ backgroundColor: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="stat-details">
                  <h3 className="stat-title">{stat.title}</h3>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-description">{stat.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="actions-section">
        <h2>Acciones</h2>
        <div className="actions-grid">
          {actionCards.map((action) => (
            <button
              key={action.title}
              className="action-card"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <div
                className="action-icon"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <div className="action-details">
                <h3>{action.title}</h3>
                <p>{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filters-header">
          <h2>Filtros</h2>
          <button onClick={clearFilters} className="btn-outline btn-sm">
            Limpiar Filtros
          </button>
        </div>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Estado</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="activa">Activa</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Tipo</label>
            <select
              value={filters.isRepetitive}
              onChange={(e) =>
                handleFilterChange("isRepetitive", e.target.value)
              }
              className="filter-select"
            >
              <option value="">Todos los tipos</option>
              <option value="true">Repetitivas</option>
              <option value="false">Únicas</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Desde</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Hasta</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="reservations-section">
        <div className="section-header">
          <h2>Reservas ({totalItems})</h2>
          <div className="header-actions">
            <span className="selected-count">
              {selectedReservations.length} seleccionadas
            </span>
            <button onClick={handleSelectAll} className="btn-outline btn-sm">
              {selectedReservations.length === reservations.length
                ? "Deseleccionar todo"
                : "Seleccionar todo"}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadReservations} className="btn-retry">
              Reintentar
            </button>
          </div>
        )}

        <div className="reservations-table-container">
          <table className="reservations-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>
                  <input
                    type="checkbox"
                    checked={
                      selectedReservations.length === reservations.length &&
                      reservations.length > 0
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>ID</th>
                <th>Recurso</th>
                <th>Usuario</th>
                <th>Fecha/Hora</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="reservation-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedReservations.some(
                        (r) => r.id === reservation.id
                      )}
                      onChange={() => handleSelectReservation(reservation)}
                    />
                  </td>
                  <td className="reservation-id">#{reservation.id}</td>
                  <td>
                    <div className="resource-info">
                      <strong>{reservation.Resource?.name}</strong>
                      <small>{reservation.Resource?.ResourceType?.name}</small>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <strong>
                        {reservation.User?.firstName}{" "}
                        {reservation.User?.lastName}
                      </strong>
                      <small>{reservation.User?.email}</small>
                    </div>
                  </td>
                  <td>
                    <div className="datetime-info">
                      <div>
                        {new Date(
                          reservation.startDateTime
                        ).toLocaleDateString()}
                      </div>
                      <small>
                        {new Date(reservation.startDateTime).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </small>
                    </div>
                  </td>
                  <td>
                    {Math.round(
                      (new Date(reservation.endDateTime) -
                        new Date(reservation.startDateTime)) /
                        (1000 * 60 * 60)
                    )}
                    h
                  </td>
                  <td>{renderStatusBadge(reservation.status)}</td>
                  <td>
                    {reservation.isRepetitive ? (
                      <span className="badge-repetitive">🔄 Repetitiva</span>
                    ) : (
                      <span className="badge-single">⭐ Única</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewDetails(reservation)}
                        className="btn-icon"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditReservation(reservation)}
                        className="btn-icon"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {reservation.isRepetitive && (
                        <button
                          onClick={() => handleManageSeries(reservation)}
                          className="btn-icon"
                          title="Gestionar serie"
                        >
                          🔄
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(reservation)}
                        className="btn-icon btn-icon-danger"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Anterior
            </button>

            <div className="pagination-pages">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`pagination-page ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Modales */}
      <ReservationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        reservation={selectedReservation}
      />

      <EditReservationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        reservation={selectedReservation}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadReservations();
          loadDashboard();
        }}
      />

      <GenericDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        item={selectedReservation}
        title="Eliminar Reserva"
        itemName="reserva"
        itemDisplayField="id"
        warningMessage="Esta acción cancelará la reserva y no se puede deshacer."
        additionalWarning={
          selectedReservation?.isRepetitive
            ? "⚠️ Esta es una reserva repetitiva. Solo se eliminará esta ocurrencia específica."
            : null
        }
        confirmButtonText="Sí, Eliminar Reserva"
        cancelButtonText="Cancelar"
        loading={operationLoading}
      />

      <ManageRepeatSeriesModal
        isOpen={isManageSeriesModalOpen}
        onClose={() => setIsManageSeriesModalOpen(false)}
        onConfirm={handleManageSeriesConfirm}
        reservation={selectedReservation}
        loading={operationLoading}
      />

      <SearchReservationsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSubmit={handleSearchSubmit}
        loading={operationLoading}
      />

      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleGenerateReport}
        loading={operationLoading}
      />

      <BulkActionsModal
        isOpen={isBulkActionsModalOpen}
        onClose={() => setIsBulkActionsModalOpen(false)}
        onConfirm={handleBulkAction}
        selectedCount={selectedReservations.length}
        loading={operationLoading}
      />
    </div>
  );
};

export default ReservationsManagement;
