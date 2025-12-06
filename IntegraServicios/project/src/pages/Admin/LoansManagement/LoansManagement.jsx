import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import LoanForm from "../../../forms/LoanForm/Loanform";
import ReturnForm from "../../../forms/ReturnForm/ReturnForm";
import { getActiveReservationsForLoansApi } from "../../../api/Reservation/reservationManagementApi";
import {
  getLoanByReservationApi,
  checkReturnExistsForLoanApi,
} from "../../../api/loan/loans";
import "./LoansManagement.css";

const LoansManagement = () => {
  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para filtros
  const [filters, setFilters] = useState({
    resourceId: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  // Estados para modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [hasReturn, setHasReturn] = useState(false);

  // Cargar reservas activas
  useEffect(() => {
    loadActiveReservations();
  }, [currentPage, filters]);

  const loadActiveReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getActiveReservationsForLoansApi({
        ...filters,
        page: currentPage,
        limit: limit,
      });

      if (response.success) {
        setReservations(response.reservations);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      }
    } catch (err) {
      console.error("Error al cargar reservas activas:", err);
      setError(err.message || "Error al cargar las reservas activas");
    } finally {
      setLoading(false);
    }
  };

  // Funciones para abrir modales
  const openLoanModal = async (reservation) => {
    setSelectedReservation(reservation);

    // Verificar si ya existe préstamo para esta reserva
    const existingLoan = await getLoanByReservationApi(reservation.id);

    if (existingLoan) {
      alert(
        `⚠️ Esta reserva ya tiene un préstamo registrado.\n\nPréstamo #${
          existingLoan.id
        }\nHora de entrega: ${new Date(
          existingLoan.deliveryTime
        ).toLocaleString()}\nEntregado por: ${
          existingLoan.Employee?.firstName
        } ${existingLoan.Employee?.lastName}`
      );

      // Verificar si ya tiene devolución
      const returnExists = await checkReturnExistsForLoanApi(existingLoan.id);
      setHasReturn(returnExists.exists);

      if (!returnExists.exists) {
        // Si no tiene devolución, preguntar si quiere registrar devolución
        if (confirm("¿Desea registrar la devolución de este préstamo?")) {
          setSelectedLoan(existingLoan);
          setModalContent("return");
          setModalOpen(true);
        }
      }
      return;
    }

    setModalContent("loan");
    setModalOpen(true);
  };

  const openReturnModal = async (reservation) => {
    setSelectedReservation(reservation);

    // Buscar el préstamo asociado a esta reserva
    const loan = await getLoanByReservationApi(reservation.id);

    if (!loan) {
      alert(
        "❌ No se encontró un préstamo registrado para esta reserva.\nPrimero debe registrar la entrega del recurso."
      );
      return;
    }

    // Verificar si ya tiene devolución
    const returnExists = await checkReturnExistsForLoanApi(loan.id);

    if (returnExists.exists) {
      alert(
        `⚠️ Este préstamo ya tiene una devolución registrada.\n\nDevolución registrada el: ${new Date(
          returnExists.return?.returnTime
        ).toLocaleString()}\nRecibido por: ${
          returnExists.return?.Employee?.firstName
        } ${returnExists.return?.Employee?.lastName}`
      );
      return;
    }

    setSelectedLoan(loan);
    setHasReturn(false);
    setModalContent("return");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedReservation(null);
    setSelectedLoan(null);
    setModalContent(null);
    setHasReturn(false);
  };

  const handleLoanSuccess = (loan) => {
    console.log("Préstamo creado:", loan);
    alert("✅ Préstamo registrado exitosamente");
    closeModal();
    loadActiveReservations(); // Recargar la lista
  };

  const handleReturnSuccess = (returnRecord) => {
    console.log("Devolución creada:", returnRecord);
    alert("✅ Devolución registrada exitosamente");
    closeModal();
    loadActiveReservations(); // Recargar la lista
  };

  // Formatear tiempo faltante
  const formatTimeRemaining = (minutes) => {
    const absMinutes = Math.abs(minutes);

    if (absMinutes < 60) {
      return `${Math.round(minutes)} min`;
    } else if (absMinutes < 1440) {
      // Menos de 24 horas
      const hours = Math.floor(absMinutes / 60);
      const mins = Math.round(absMinutes % 60);
      return `${minutes < 0 ? "-" : ""}${hours}h ${
        mins > 0 ? `${mins}min` : ""
      }`;
    } else {
      const days = Math.floor(absMinutes / 1440);
      const hours = Math.floor((absMinutes % 1440) / 60);
      return `${minutes < 0 ? "-" : ""}${days}d ${
        hours > 0 ? `${hours}h` : ""
      }`;
    }
  };

  // Determinar si puede registrar entrega
  const canRegisterPickup = (reservation) => {
    const now = new Date();
    const startTime = new Date(reservation.startDateTime);
    const timeDiff = (startTime - now) / (1000 * 60); // minutos

    // Puede registrar si está dentro de ±5 minutos O si ya pasó (retrasado)
    return Math.abs(timeDiff) <= 5 || timeDiff < -5;
  };

  // Renderizar tiempo faltante con colores
  const renderTimeRemaining = (reservation) => {
    const now = new Date();
    const startTime = new Date(reservation.startDateTime);
    const timeDiff = (startTime - now) / (1000 * 60); // minutos

    let className = "time-badge ";
    let icon = "";

    if (timeDiff < -5) {
      className += "overdue";
      icon = "⚠️ ";
    } else if (timeDiff <= 5 && timeDiff >= -5) {
      className += "ready";
      icon = "✅ ";
    } else if (timeDiff > 5 && timeDiff <= 60) {
      className += "soon";
      icon = "🕐 ";
    } else {
      className += "future";
      icon = "📅 ";
    }

    const formattedTime = formatTimeRemaining(timeDiff);

    return (
      <span className={className}>
        {icon}
        {formattedTime}
      </span>
    );
  };

  // Formatear ventana de entrega
  const formatDeliveryWindow = (reservation) => {
    const startTime = new Date(reservation.startDateTime);
    const windowStart = new Date(startTime.getTime() - 5 * 60000);
    const windowEnd = new Date(startTime.getTime() + 5 * 60000);

    return (
      <div className="delivery-window">
        <div className="window-time">
          {windowStart.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          <span className="window-separator">→</span>
          {windowEnd.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <small>±5 min del inicio</small>
      </div>
    );
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
      resourceId: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  // Estadísticas
  const getStats = () => {
    const stats = {
      total: reservations.length,
      readyForPickup: reservations.filter((r) => {
        const now = new Date();
        const startTime = new Date(r.startDateTime);
        const timeDiff = (startTime - now) / (1000 * 60);
        return Math.abs(timeDiff) <= 5;
      }).length,
      overdue: reservations.filter((r) => {
        const now = new Date();
        const startTime = new Date(r.startDateTime);
        const timeDiff = (startTime - now) / (1000 * 60);
        return timeDiff < -5;
      }).length,
      future: reservations.filter((r) => {
        const now = new Date();
        const startTime = new Date(r.startDateTime);
        const timeDiff = (startTime - now) / (1000 * 60);
        return timeDiff > 5;
      }).length,
    };
    return stats;
  };

  const stats = getStats();

  if (loading && reservations.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando reservas activas...</p>
      </div>
    );
  }

  return (
    <div className="loans-management">
      <div className="page-header">
        <h1 className="page-title">Gestión de Préstamos</h1>
        <p className="page-subtitle">
          Registra entregas y devoluciones de recursos reservados
        </p>
      </div>

      {/* Dashboard de estadísticas */}
      <div className="dashboard-section">
        <h2>Resumen de Reservas Activas</h2>
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ backgroundColor: "#2563eb" }}>
                📋
              </div>
              <div className="stat-details">
                <h3 className="stat-title">Total Reservas</h3>
                <p className="stat-value">{stats.total}</p>
                <p className="stat-description">Activas y sin préstamo</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ backgroundColor: "#10b981" }}>
                ✅
              </div>
              <div className="stat-details">
                <h3 className="stat-title">Listas para entrega</h3>
                <p className="stat-value">{stats.readyForPickup}</p>
                <p className="stat-description">Dentro de ±5 minutos</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ backgroundColor: "#f59e0b" }}>
                ⏳
              </div>
              <div className="stat-details">
                <h3 className="stat-title">Futuras</h3>
                <p className="stat-value">{stats.future}</p>
                <p className="stat-description">Más de 5 min de diferencia</p>
              </div>
            </div>
          </Card>

          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-icon" style={{ backgroundColor: "#ef4444" }}>
                ⚠️
              </div>
              <div className="stat-details">
                <h3 className="stat-title">Retrasados</h3>
                <p className="stat-value">{stats.overdue}</p>
                <p className="stat-description">Fuera de lapso</p>
              </div>
            </div>
          </Card>
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

      {/* Lista de reservas activas */}
      <div className="reservations-section">
        <div className="section-header">
          <h2>Reservas Activas para Préstamo ({totalItems})</h2>
          <button
            onClick={loadActiveReservations}
            className="btn-outline btn-sm"
          >
            🔄 Actualizar
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadActiveReservations} className="btn-retry">
              Reintentar
            </button>
          </div>
        )}

        <div className="reservations-table-container">
          <table className="reservations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Recurso</th>
                <th>Usuario</th>
                <th>Fecha/Hora Inicio</th>
                <th>Propósito</th>
                <th>Tiempo Faltante</th>
                <th>Ventana de Entrega</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id} className="reservation-row">
                  <td className="reservation-id">#{reservation.id}</td>
                  <td>
                    <div className="resource-info">
                      <strong>{reservation.Resource.name}</strong>
                      <small>
                        {reservation.Resource.ResourceType.name} •{" "}
                        {reservation.Resource.ResourceType.Unit.name}
                      </small>
                      {reservation.Resource.features && (
                        <small className="resource-features">
                          {Object.entries(reservation.Resource.features).map(
                            ([key, value]) => (
                              <span key={key}>
                                {key}: {value}
                              </span>
                            )
                          )}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <strong>
                        {reservation.User.firstName} {reservation.User.lastName}
                      </strong>
                      <small>{reservation.User.email}</small>
                      <small>
                        {reservation.User.rol} • ID:{" "}
                        {reservation.User.identificationNumber}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="datetime-info">
                      <div>
                        {new Date(reservation.startDateTime).toLocaleDateString(
                          "es-ES"
                        )}
                      </div>
                      <small>
                        {new Date(reservation.startDateTime).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </small>
                      <small>
                        Duración:{" "}
                        {Math.round(
                          (new Date(reservation.endDateTime) -
                            new Date(reservation.startDateTime)) /
                            (1000 * 60)
                        )}{" "}
                        min
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="purpose-info">
                      {reservation.purpose}
                      <small>Asistentes: {reservation.attendees}</small>
                    </div>
                  </td>
                  <td>{renderTimeRemaining(reservation)}</td>
                  <td>{formatDeliveryWindow(reservation)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openLoanModal(reservation)}
                        className="btn-action btn-pickup"
                        title="Registrar entrega"
                        disabled={!canRegisterPickup(reservation)}
                      >
                        📦 Entregar
                      </button>

                      <button
                        onClick={() => openReturnModal(reservation)}
                        className="btn-action btn-return"
                        title="Registrar devolución"
                      >
                        ↩️ Devolver
                      </button>
                      <small className="action-note">
                        {!canRegisterPickup(reservation)
                          ? "Disponible dentro de la ventana de entrega"
                          : "Haz clic para registrar entrega"}
                      </small>
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

      {/* Instrucciones */}
      <div className="instructions-section">
        <h3>📋 Instrucciones para préstamos:</h3>
        <ol>
          <li>
            <strong>Ventana de entrega</strong>: ±5 minutos del horario de
            inicio de la reserva
          </li>
          <li>
            <strong>Botón "Entregar"</strong>: Solo disponible DENTRO de la
            ventana de entrega o si YA PASÓ (retrasado)
          </li>
          <li>
            <strong>Fallo de servicio</strong>: Se marca automáticamente si la
            entrega está fuera de ±5 minutos
          </li>
          <li>
            <strong>Botón "Devolver"</strong>: Solo disponible después de
            registrar la entrega y antes de registrar la devolución
          </li>
          <li>
            <strong>Tiempo faltante</strong>:
            <ul>
              <li>
                <span className="time-badge ready">✅</span> Dentro de ventana
                (±5 min)
              </li>
              <li>
                <span className="time-badge overdue">⚠️</span> Retrasado (fuera
                de ventana)
              </li>
              <li>
                <span className="time-badge soon">🕐</span> Próximo (5-60 min)
              </li>
              <li>
                <span className="time-badge future">📅</span> Futuro (+60 min)
              </li>
            </ul>
          </li>
        </ol>
      </div>

      {/* Modal Genérico */}
      <GenericModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          modalContent === "loan"
            ? "Registrar Entrega de Recurso"
            : "Registrar Devolución de Recurso"
        }
        subtitle={
          modalContent === "loan"
            ? `Reserva #${selectedReservation?.id} - ${selectedReservation?.Resource?.name}`
            : `Préstamo #${selectedLoan?.id} - ${selectedLoan?.Reservation?.Resource?.name}`
        }
        size="large"
      >
        {modalContent === "loan" && selectedReservation && (
          <LoanForm
            reservation={selectedReservation}
            onSuccess={handleLoanSuccess}
            onCancel={closeModal}
          />
        )}

        {modalContent === "return" && selectedLoan && (
          <ReturnForm
            loan={selectedLoan}
            onSuccess={handleReturnSuccess}
            onCancel={closeModal}
          />
        )}
      </GenericModal>
    </div>
  );
};

export default LoansManagement;
