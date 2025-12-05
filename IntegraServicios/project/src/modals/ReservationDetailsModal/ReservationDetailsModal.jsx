import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import Card from "../../components/common/Card";
import {
  getReservationDetailsApi,
  updateReservationApi
} from "../../api/Reservation/reservationManagementApi";
import "./ReservationDetailsModal.css";

const ReservationDetailsModal = ({ isOpen, onClose, reservation: initialReservation }) => {
  const [reservation, setReservation] = useState(initialReservation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (isOpen && initialReservation) {
      if (initialReservation.id && !initialReservation.loan) {
        loadDetails();
      } else {
        setReservation(initialReservation);
        setAdminNotes(initialReservation.adminNotes || '');
      }
    }
  }, [isOpen, initialReservation]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReservationDetailsApi(initialReservation.id);
      setReservation(response.reservation);
      setAdminNotes(response.reservation.adminNotes || '');
    } catch (err) {
      console.error("Error al cargar detalles:", err);
      setError("Error al cargar los detalles de la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setLoading(true);
      await updateReservationApi(reservation.id, { adminNotes });
      setIsEditingNotes(false);
      // Recargar detalles
      await loadDetails();
    } catch (err) {
      setError("Error al guardar las notas");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const calculateDuration = () => {
    if (!reservation?.startDateTime || !reservation?.endDateTime) return 'N/A';
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
      cancelada: { label: "Cancelada", color: "#ef4444", bg: "#fee2e2" }
    };
    
    const config = statusConfig[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
    
    return (
      <span 
        className="status-badge"
        style={{ 
          color: config.color, 
          backgroundColor: config.bg,
          borderColor: config.color
        }}
      >
        {config.label}
      </span>
    );
  };

  const tabs = [
    { id: 'details', label: '📋 Detalles' },
    { id: 'loan', label: '📦 Préstamo', disabled: !reservation?.loan },
    { id: 'rating', label: '⭐ Calificación', disabled: !reservation?.rating },
    { id: 'return', label: '🔄 Devolución', disabled: !reservation?.return },
    { id: 'series', label: '🔄 Serie', disabled: !reservation?.isRepetitive },
    { id: 'notes', label: '📝 Notas' }
  ];

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
                {reservation.Resource?.name || 'Recurso no disponible'}
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
                <strong>Fecha creación:</strong> {formatDateTime(reservation.createdAt)}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="tab-content">
            {/* Tab: Detalles */}
            {activeTab === 'details' && (
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
                      <span>{reservation.User?.firstName} {reservation.User?.lastName}</span>
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
                      <span>{reservation.User?.phone || 'No registrado'}</span>
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
                      <span>{reservation.Resource?.location || 'No especificada'}</span>
                    </div>
                    <div className="info-item">
                      <label>Capacidad:</label>
                      <span>{reservation.Resource?.capacity || 'No especificada'}</span>
                    </div>
                    <div className="info-item">
                      <label>Descripción:</label>
                      <span className="description-text">{reservation.Resource?.description || 'Sin descripción'}</span>
                    </div>
                  </div>
                </Card>

                <Card className="info-card">
                  <h4 className="card-title">🏛️ Información de Unidad</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Unidad:</label>
                      <span>{reservation.Resource?.ResourceType?.Unit?.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Email contacto:</label>
                      <span>{reservation.Resource?.ResourceType?.Unit?.contactEmail || 'No disponible'}</span>
                    </div>
                    <div className="info-item">
                      <label>Teléfono contacto:</label>
                      <span>{reservation.Resource?.ResourceType?.Unit?.contactPhone || 'No disponible'}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Tab: Préstamo */}
            {activeTab === 'loan' && reservation.loan && (
              <Card className="info-card">
                <h4 className="card-title">📦 Información de Préstamo</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>ID Préstamo:</label>
                    <span>#{reservation.loan.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Fecha entrega:</label>
                    <span>{formatDateTime(reservation.loan.deliveryTime)}</span>
                  </div>
                  <div className="info-item">
                    <label>Empleado:</label>
                    <span>
                      {reservation.loan.employee?.firstName} {reservation.loan.employee?.lastName}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Estado:</label>
                    <span>
                      {reservation.loan.hasFailure ? (
                        <span className="badge-danger">⚠️ Con fallas</span>
                      ) : (
                        <span className="badge-success">✅ Sin fallas</span>
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Tab: Calificación */}
            {activeTab === 'rating' && reservation.rating && (
              <Card className="info-card">
                <h4 className="card-title">⭐ Calificación y Comentario</h4>
                <div className="rating-section">
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`star ${i < reservation.rating.stars ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                    <span className="rating-value">{reservation.rating.stars}/5</span>
                  </div>
                  
                  {reservation.rating.comment && (
                    <div className="comment-section">
                      <label>Comentario:</label>
                      <div className="comment-box">
                        <p>{reservation.rating.comment}</p>
                      </div>
                    </div>
                  )}

                  <div className="rating-meta">
                    <span>
                      <strong>Calificado por:</strong> {reservation.rating.user?.firstName} {reservation.rating.user?.lastName}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Tab: Devolución */}
            {activeTab === 'return' && reservation.return && (
              <Card className="info-card">
                <h4 className="card-title">🔄 Información de Devolución</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>ID Devolución:</label>
                    <span>#{reservation.return.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Fecha devolución:</label>
                    <span>{formatDateTime(reservation.return.returnTime)}</span>
                  </div>
                  <div className="info-item">
                    <label>Empleado:</label>
                    <span>
                      {reservation.return.employee?.firstName} {reservation.return.employee?.lastName}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Estado:</label>
                    <span>
                      {reservation.return.hasFailure ? (
                        <span className="badge-danger">⚠️ Con fallas reportadas</span>
                      ) : (
                        <span className="badge-success">✅ Sin fallas</span>
                      )}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Tab: Serie Repetitiva */}
            {activeTab === 'series' && reservation.isRepetitive && reservation.repeatSeries && (
              <Card className="info-card">
                <h4 className="card-title">🔄 Serie de Reservas Repetitivas</h4>
                <div className="series-info">
                  <div className="series-summary">
                    <p><strong>Total en serie:</strong> {reservation.repeatSeries.length + 1} reservas</p>
                    <p><strong>Propósito común:</strong> {reservation.purpose}</p>
                  </div>
                  
                  <div className="series-list">
                    <h5>Otras reservas de la serie:</h5>
                    <div className="series-table">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Hora</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservation.repeatSeries.map(seriesReservation => (
                            <tr key={seriesReservation.id}>
                              <td>#{seriesReservation.id}</td>
                              <td>{formatDate(seriesReservation.startDateTime)}</td>
                              <td>{formatTime(seriesReservation.startDateTime)}</td>
                              <td>{getStatusBadge(seriesReservation.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Tab: Notas */}
            {activeTab === 'notes' && (
              <Card className="info-card">
                <h4 className="card-title">📝 Notas Administrativas</h4>
                <div className="notes-section">
                  {isEditingNotes ? (
                    <div className="notes-editor">
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Agregar notas administrativas..."
                        rows={6}
                        className="notes-textarea"
                      />
                      <div className="notes-actions">
                        <button
                          onClick={handleSaveNotes}
                          className="btn-primary"
                          disabled={loading}
                        >
                          {loading ? 'Guardando...' : 'Guardar notas'}
                        </button>
                        <button
                          onClick={() => setIsEditingNotes(false)}
                          className="btn-outline"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="notes-display">
                      {adminNotes ? (
                        <div className="notes-content">
                          <p>{adminNotes}</p>
                        </div>
                      ) : (
                        <div className="empty-notes">
                          <p>No hay notas administrativas</p>
                        </div>
                      )}
                      <button
                        onClick={() => setIsEditingNotes(true)}
                        className="btn-outline btn-sm"
                      >
                        {adminNotes ? 'Editar notas' : 'Agregar notas'}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-actions">
              <button onClick={onClose} className="btn-outline">
                Cerrar
              </button>
              <div className="footer-meta">
                <small>Última actualización: {formatDateTime(reservation.updatedAt)}</small>
              </div>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ReservationDetailsModal;