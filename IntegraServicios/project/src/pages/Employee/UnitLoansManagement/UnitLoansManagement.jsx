import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import LoanForm from "../../../forms/LoanForm/Loanform";
import ReturnForm from "../../../forms/ReturnForm/ReturnForm";
import { getActiveReservationsForLoansApi } from "../../../api/Reservation/reservationManagementApi";
import { getMeApi } from "../../../api/user/auth"; // Asegúrate de ajustar la ruta
import "./UnitLoansManagement.css";

const UnitLoansManagement = () => {
  // Estados principales
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userUnit, setUserUnit] = useState(null);

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

  // Obtener información del usuario (empleado de unidad)
  useEffect(() => {
    loadUserUnit();
  }, []);

  const loadUserUnit = async () => {
    try {
      const token = localStorage.getItem("token"); // O de donde obtengas el token
      const userData = await getMeApi(token);

      if (userData.unit) {
        setUserUnit(userData.unit);
      } else {
        setError("No se encontró la unidad del usuario");
      }
    } catch (err) {
      console.error("Error al cargar la unidad del usuario:", err);
      setError("Error al cargar la información del usuario");
    }
  };

  // Cargar reservas activas
  useEffect(() => {
    if (userUnit) {
      loadActiveReservations();
    }
  }, [currentPage, filters, userUnit]);

  const loadActiveReservations = async () => {
    if (!userUnit) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getActiveReservationsForLoansApi({
        ...filters,
        page: currentPage,
        limit: limit,
      });

      if (response.success) {
        // Filtrar reservas por la unidad del empleado
        const filteredReservations = response.reservations.filter(
          (reservation) =>
            reservation.Resource?.ResourceType?.Unit?.id === userUnit.id
        );

        setReservations(filteredReservations);
        // Ajustar la paginación al número de reservas filtradas
        const filteredTotal = filteredReservations.length;
        setTotalPages(Math.ceil(filteredTotal / limit));
        setTotalItems(filteredTotal);
      }
    } catch (err) {
      console.error("Error al cargar reservas activas:", err);
      setError(err.message || "Error al cargar las reservas activas");
    } finally {
      setLoading(false);
    }
  };

  // Funciones para abrir modales
  const openLoanModal = (reservation) => {
    // Verificar si ya tiene préstamo
    if (reservation.Loan) {
      alert(
        `⚠️ Esta reserva ya tiene un préstamo registrado.\n\nPréstamo #${
          reservation.Loan.id
        }\nHora de entrega: ${new Date(
          reservation.Loan.deliveryTime
        ).toLocaleString()}\nEntregado por: ${
          reservation.Loan.Employee?.firstName || "N/A"
        } ${reservation.Loan.Employee?.lastName || ""}`
      );
      return;
    }

    // Verificar si está en la ventana de entrega
    if (!reservation.canRegisterPickup) {
      alert(
        "⚠️ La entrega solo puede registrarse dentro de la ventana de ±5 minutos del horario de inicio de la reserva."
      );
      return;
    }

    setSelectedReservation(reservation);
    setModalContent("loan");
    setModalOpen(true);
  };

  const openReturnModal = (reservation) => {
    // Verificar si tiene préstamo
    if (!reservation.Loan) {
      alert(
        "❌ No se encontró un préstamo registrado para esta reserva.\nPrimero debe registrar la entrega del recurso."
      );
      return;
    }

    // Verificar si ya tiene devolución
    if (reservation.Loan.Return) {
      alert(
        `⚠️ Este préstamo ya tiene una devolución registrada.\n\nDevolución registrada el: ${new Date(
          reservation.Loan.Return.returnTime
        ).toLocaleString()}`
      );
      return;
    }

    setSelectedReservation(reservation);
    setModalContent("return");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedReservation(null);
    setModalContent(null);
  };

  const handleLoanSuccess = (loan) => {
    console.log("Préstamo creado:", loan);
    closeModal();
    loadActiveReservations(); // Recargar la lista
  };

  const handleReturnSuccess = (returnRecord) => {
    console.log("Devolución creada:", returnRecord);
    closeModal();
    loadActiveReservations(); // Recargar la lista
  };

  // Formatear tiempo faltante
  const formatTimeRemaining = (minutes) => {
    const absMinutes = Math.abs(minutes);

    if (absMinutes < 60) {
      return `${Math.round(minutes)} min`;
    } else if (absMinutes < 1440) {
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

  // Renderizar estado del proceso
  const renderProcessStatus = (reservation) => {
    if (reservation.Loan) {
      if (reservation.Loan.Return) {
        return <span className="process-badge completed">✅ Completado</span>;
      } else {
        return <span className="process-badge delivered">📦 Entregado</span>;
      }
    } else {
      return <span className="process-badge pending">⏳ Sin entregar</span>;
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
      resourceId: "",
      userId: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando reservas de tu unidad...</p>
      </div>
    );
  }

  return (
    <div className="loans-management">
      <div className="page-header">
        <h1 className="page-title">
          Gestión de Préstamos - {userUnit?.name || "Cargando..."}
        </h1>
        <p className="page-subtitle">
          Registra entregas y devoluciones de recursos de tu unidad
        </p>
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
          <h2>
            Reservas Activas de {userUnit?.name || "tu unidad"} ({totalItems})
          </h2>
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

        {reservations.length === 0 && !loading ? (
          <div className="no-results">
            <p>📭 No hay reservas activas para tu unidad en este momento</p>
            <small>
              Las reservas aparecerán aquí cuando estén confirmadas y pendientes
              de entrega o devolución
            </small>
          </div>
        ) : (
          <div className="reservations-table-container">
            <table className="reservations-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Recurso</th>
                  <th>Usuario</th>
                  <th>Fecha/Hora Inicio</th>
                  <th>Estado del Proceso</th>
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
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <strong>
                          {reservation.User.firstName}{" "}
                          {reservation.User.lastName}
                        </strong>
                        <small>{reservation.User.email}</small>
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
                    <td>{renderProcessStatus(reservation)}</td>
                    <td>{renderTimeRemaining(reservation)}</td>
                    <td>{formatDeliveryWindow(reservation)}</td>
                    <td>
                      <div className="action-buttons">
                        {!reservation.Loan ? (
                          <>
                            <button
                              onClick={() => openLoanModal(reservation)}
                              className="btn-action btn-pickup"
                              title="Registrar entrega"
                              disabled={!reservation.canRegisterPickup}
                            >
                              📦 Entregar
                            </button>
                            <small className="action-note">
                              {!reservation.canRegisterPickup
                                ? "Disponible dentro de la ventana de entrega"
                                : "Haz clic para registrar entrega"}
                            </small>
                          </>
                        ) : !reservation.Loan.Return ? (
                          <>
                            <button
                              onClick={() => openReturnModal(reservation)}
                              className="btn-action btn-return"
                              title="Registrar devolución"
                            >
                              ↩️ Devolver
                            </button>
                            <small className="action-note action-note-success">
                              Entregado el{" "}
                              {new Date(
                                reservation.Loan.deliveryTime
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </>
                        ) : (
                          <small className="action-note action-note-completed">
                            ✅ Proceso completado
                          </small>
                        )}
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

      {/* Instrucciones */}
      <div className="instructions-section">
        <h3>📋 Instrucciones para préstamos:</h3>
        <ol>
          <li>
            <strong>Filtro automático</strong>: Solo se muestran las reservas de
            tu unidad ({userUnit?.name})
          </li>
          <li>
            <strong>Ciclo completo</strong>: Las reservas permanecen en la lista
            hasta que se completa la devolución
          </li>
          <li>
            <strong>Ventana de entrega</strong>: ±5 minutos del horario de
            inicio de la reserva
          </li>
          <li>
            <strong>Botón "Entregar"</strong>: Solo disponible DENTRO de la
            ventana de entrega
          </li>
          <li>
            <strong>Botón "Devolver"</strong>: Disponible DESPUÉS de registrar
            la entrega
          </li>
          <li>
            <strong>Estados del proceso</strong>:
            <ul>
              <li>
                <span className="process-badge pending">⏳</span> Sin entregar
              </li>
              <li>
                <span className="process-badge delivered">📦</span> Entregado
                (esperando devolución)
              </li>
              <li>
                <span className="process-badge completed">✅</span> Completado
                (sale de la lista)
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
            ? selectedReservation
              ? `Reserva #${selectedReservation.id} - ${selectedReservation.Resource?.name}`
              : "Cargando..."
            : selectedReservation
            ? `Préstamo #${selectedReservation.Loan?.id} - ${selectedReservation.Resource?.name}`
            : "Cargando..."
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

        {modalContent === "return" && selectedReservation?.Loan && (
          <ReturnForm
            loan={selectedReservation.Loan}
            onSuccess={handleReturnSuccess}
            onCancel={closeModal}
          />
        )}
      </GenericModal>
    </div>
  );
};

export default UnitLoansManagement;
