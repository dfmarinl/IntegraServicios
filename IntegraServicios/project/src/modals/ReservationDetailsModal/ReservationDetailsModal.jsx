import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import Card from "../../components/common/Card";
import { getReservationDetailsApi } from "../../api/Reservation/reservationManagementApi";
import "./ReservationDetailsModal.css";

const ReservationDetailsModal = ({
  isOpen,
  onClose,
  reservation: initialReservation,
}) => {
  const [reservation, setReservation] = useState(initialReservation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && initialReservation) {
      if (initialReservation.id && !initialReservation.loan) {
        loadDetails();
      } else {
        setReservation(initialReservation);
      }
    }
  }, [isOpen, initialReservation]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReservationDetailsApi(initialReservation.id);
      setReservation(response.reservation);
    } catch (err) {
      console.error("Error al cargar detalles:", err);
      setError("Error al cargar los detalles de la reserva");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const calculateDuration = () => {
    if (!reservation?.startDateTime || !reservation?.endDateTime) return "N/A";
    const start = new Date(reservation.startDateTime);
    const end = new Date(reservation.endDateTime);
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status) => {
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

  if (!reservation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reserva #${reservation.id}`}
      size="xl"
      maxWidth="1200px"
    >
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando detalles...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadDetails} className="btn-retry">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="reservation-header">
            <div className="header-main">
              <h3 className="reservation-title">
                {reservation.Resource?.name || "Recurso no disponible"}
              </h3>
              <div className="header-badges">
                {getStatusBadge(reservation.status)}
                {reservation.isRepetitive && (
                  <span className="badge-repetitive">🔄 Repetitiva</span>
                )}
              </div>
            </div>
            <div className="header-meta">
              <span className="meta-item">
                <strong>ID:</strong> #{reservation.id}
              </span>
              <span className="meta-item">
                <strong>Fecha creación:</strong>{" "}
                {formatDateTime(reservation.createdAt)}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="modal-body">
            <div className="details-grid">
              <Card className="info-card">
                <h4 className="card-title">📅 Información de Reserva</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Fecha:</label>
                    <span>{formatDate(reservation.startDateTime)}</span>
                  </div>
                  <div className="info-item">
                    <label>Hora inicio:</label>
                    <span>{formatTime(reservation.startDateTime)}</span>
                  </div>
                  <div className="info-item">
                    <label>Hora fin:</label>
                    <span>{formatTime(reservation.endDateTime)}</span>
                  </div>
                  <div className="info-item">
                    <label>Duración:</label>
                    <span>{calculateDuration()}</span>
                  </div>
                  <div className="info-item">
                    <label>Asistentes:</label>
                    <span>{reservation.attendees || 1} persona(s)</span>
                  </div>
                  <div className="info-item">
                    <label>Propósito:</label>
                    <span className="purpose-text">{reservation.purpose}</span>
                  </div>
                </div>
              </Card>

              <Card className="info-card">
                <h4 className="card-title">👤 Información del Usuario</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nombre:</label>
                    <span>
                      {reservation.User?.firstName} {reservation.User?.lastName}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{reservation.User?.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Rol:</label>
                    <span className="role-badge">{reservation.User?.rol}</span>
                  </div>
                  <div className="info-item">
                    <label>Teléfono:</label>
                    <span>{reservation.User?.phone || "No registrado"}</span>
                  </div>
                </div>
              </Card>

              <Card className="info-card">
                <h4 className="card-title">🏢 Información del Recurso</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Recurso:</label>
                    <span>{reservation.Resource?.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Tipo:</label>
                    <span>{reservation.Resource?.ResourceType?.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Ubicación:</label>
                    <span>
                      {reservation.Resource?.location || "No especificada"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Capacidad:</label>
                    <span>
                      {reservation.Resource?.capacity || "No especificada"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Descripción:</label>
                    <span className="description-text">
                      {reservation.Resource?.description || "Sin descripción"}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="info-card">
                <h4 className="card-title">🏛️ Información de Unidad</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Unidad:</label>
                    <span>
                      {reservation.Resource?.ResourceType?.Unit?.name}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Email contacto:</label>
                    <span>
                      {reservation.Resource?.ResourceType?.Unit?.contactEmail ||
                        "No disponible"}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Teléfono contacto:</label>
                    <span>
                      {reservation.Resource?.ResourceType?.Unit?.contactPhone ||
                        "No disponible"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-actions">
              <button onClick={onClose} className="btn-outline">
                Cerrar
              </button>
              <div className="footer-meta">
                <small>
                  Última actualización: {formatDateTime(reservation.updatedAt)}
                </small>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ReservationDetailsModal;
