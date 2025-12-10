import { useState, useEffect } from "react";
import {
  getAllReservationsWithDetailsApi,
  getReservationDetailsApi,
  updateReservationApi,
  deleteReservationApi,
  searchReservationsApi,
} from "../../../api/Reservation/reservationManagementApi";
import { getMeApi } from "../../../api/user/auth";
import GenericDeleteModal from "../../../modals/GenericDeletemodal/GenericDeleteModal";
import ReservationDetailsModal from "../../../modals/ReservationDetailsModal/ReservationDetailsModal";
import EditReservationModal from "../../../modals/EditReservationModal/EditReservationModal";
import SearchReservationsModal from "../../../modals/SearchReservationsModal/SearchReservationsModal";
import "./EmployeeReservationsManagement.css";

const EmployeeReservationsManagement = () => {
  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [employeeUnitId, setEmployeeUnitId] = useState(null);

  // Estados para selección y detalles
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedReservations, setSelectedReservations] = useState([]);

  // Estados para filtros y paginación
  const [filters, setFilters] = useState({
    status: "all",
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Estados para operaciones
  const [operationLoading, setOperationLoading] = useState(false);

  // Cargar datos del empleado al montar el componente
  useEffect(() => {
    loadEmployeeData();
  }, []);

  // Cargar reservas cuando cambian los filtros, página o se obtiene el unitId
  useEffect(() => {
    if (employeeUnitId !== null) {
      loadReservations();
    }
  }, [currentPage, filters, employeeUnitId]);

  const loadEmployeeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await getMeApi(token);

      console.log("👤 Datos del empleado:", response);

      setEmployeeData(response);

      if (response.unitId) {
        setEmployeeUnitId(response.unitId);
        console.log(
          "🏢 Unidad del empleado:",
          response.unitId,
          "-",
          response.unit?.name
        );
      } else {
        setError("No se encontró una unidad asignada para este empleado");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error al cargar datos del empleado:", err);
      setError(err.message || "Error al cargar datos del empleado");
      setLoading(false);
    }
  };

  const loadReservations = async () => {
    if (!employeeUnitId) return;

    try {
      setLoading(true);
      setError(null);

      // ✅ FILTRO CRÍTICO: Enviar unitId en los parámetros de la petición
      const response = await getAllReservationsWithDetailsApi({
        ...filters,
        unitId: employeeUnitId, // 🔒 Filtrar en el backend por la unidad del empleado
        page: currentPage,
        limit: limit,
      });

      console.log(
        "📋 Reservas recibidas del backend para unidad",
        employeeUnitId,
        ":",
        response
      );

      // ✅ DOBLE FILTRO DE SEGURIDAD: Filtrar en frontend también
      // Esto asegura que SOLO se muestren reservas de la unidad del empleado
      const filteredReservations = response.reservations.filter(
        (reservation) => {
          const reservationUnitId =
            reservation.Resource?.ResourceType?.Unit?.id;
          const matches = reservationUnitId === employeeUnitId;

          if (!matches) {
            console.warn(
              `⚠️ Reserva #${reservation.id} no pertenece a la unidad ${employeeUnitId} (pertenece a ${reservationUnitId})`
            );
          }

          return matches;
        }
      );

      console.log(
        "✅ Reservas filtradas para mostrar:",
        filteredReservations.length
      );

      setReservations(filteredReservations);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(filteredReservations.length); // Usar el count filtrado
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
    } catch (err) {
      setError(err.message || "Error al eliminar reserva");
    } finally {
      setOperationLoading(false);
    }
  };

  // Manejar búsqueda avanzada
  const handleSearchSubmit = async (criteria) => {
    try {
      setLoading(true);

      // ✅ FILTRO CRÍTICO: Agregar unitId a la búsqueda
      const searchCriteriaWithUnit = {
        ...criteria,
        unitId: employeeUnitId, // 🔒 Filtrar por la unidad del empleado
      };

      console.log("🔍 Buscando con criterios:", searchCriteriaWithUnit);

      const results = await searchReservationsApi(searchCriteriaWithUnit);

      // ✅ DOBLE FILTRO DE SEGURIDAD en búsqueda también
      const filteredResults = results.reservations.filter(
        (reservation) =>
          reservation.Resource?.ResourceType?.Unit?.id === employeeUnitId
      );

      console.log(
        "🔍 Resultados de búsqueda filtrados:",
        filteredResults.length
      );

      setReservations(filteredResults);
      setTotalItems(filteredResults.length);
      setTotalPages(1);

      setIsSearchModalOpen(false);
    } catch (err) {
      setError(err.message || "Error en búsqueda");
    } finally {
      setLoading(false);
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
      resourceId: "",
      userId: "",
      isRepetitive: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

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
        <p>Cargando reservas de tu unidad...</p>
      </div>
    );
  }

  if (!employeeUnitId && !loading) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>No se pudo cargar la información</h2>
        <p>{error || "No tienes una unidad asignada"}</p>
      </div>
    );
  }

  return (
    <div className="employee-reservations-management">
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">Gestión de Reservas</h1>
            <p className="page-subtitle">
              Administra las reservas de tu unidad
            </p>
          </div>
          {employeeData && (
            <div className="unit-info-badge">
              <div className="unit-icon">🏢</div>
              <div className="unit-details">
                <span className="unit-label">Unidad</span>
                <strong className="unit-name">{employeeData.unit?.name}</strong>
              </div>
            </div>
          )}
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
          <h2>
            Reservas de {employeeData?.unit?.name || "tu unidad"} ({totalItems})
          </h2>
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

        {reservations.length === 0 && !loading ? (
          <div className="no-results">
            <div className="no-results-icon">📭</div>
            <h3>No hay reservas</h3>
            <p>
              No se encontraron reservas para tu unidad con los filtros
              aplicados
            </p>
          </div>
        ) : (
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
                        <small>
                          {reservation.Resource?.ResourceType?.name}
                          {reservation.Resource?.ResourceType?.Unit && (
                            <>
                              {" "}
                              • {reservation.Resource.ResourceType.Unit.name}
                            </>
                          )}
                        </small>
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
                          ).toLocaleDateString("es-ES")}
                        </div>
                        <small>
                          {new Date(
                            reservation.startDateTime
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
        )}

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

      <SearchReservationsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSubmit={handleSearchSubmit}
        loading={operationLoading}
      />
    </div>
  );
};

export default EmployeeReservationsManagement;
