import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import { updateReservationApi } from "../../api/Reservation/reservationManagementApi";
import "./EditReservationModal.css";

const EditReservationModal = ({ isOpen, onClose, reservation, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: '',
    startDateTime: '',
    endDateTime: '',
    purpose: '',
    attendees: 1,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (reservation) {
      setFormData({
        status: reservation.status,
        startDateTime: reservation.startDateTime ? new Date(reservation.startDateTime).toISOString().slice(0, 16) : '',
        endDateTime: reservation.endDateTime ? new Date(reservation.endDateTime).toISOString().slice(0, 16) : '',
        purpose: reservation.purpose || '',
        attendees: reservation.attendees || 1,
        notes: ''
      });
    }
  }, [reservation]);

  const validateForm = () => {
    const errors = {};
    const now = new Date();

    if (!formData.status) {
      errors.status = "El estado es requerido";
    }

    if (formData.startDateTime) {
      const startDate = new Date(formData.startDateTime);
      if (startDate < now && reservation.status === 'pendiente') {
        errors.startDateTime = "No se puede programar en el pasado";
      }
    }

    if (formData.endDateTime) {
      const endDate = new Date(formData.endDateTime);
      if (formData.startDateTime) {
        const startDate = new Date(formData.startDateTime);
        if (endDate <= startDate) {
          errors.endDateTime = "La fecha de fin debe ser posterior a la de inicio";
        }
      }
    }

    if (formData.purpose && formData.purpose.trim().length === 0) {
      errors.purpose = "El propósito no puede estar vacío";
    }

    if (formData.attendees < 1) {
      errors.attendees = "Debe haber al menos 1 asistente";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      const updates = {};
      if (formData.status !== reservation.status) {
        updates.status = formData.status;
      }
      if (formData.startDateTime && formData.endDateTime) {
        updates.startDateTime = new Date(formData.startDateTime).toISOString();
        updates.endDateTime = new Date(formData.endDateTime).toISOString();
      }
      if (formData.purpose !== reservation.purpose) {
        updates.purpose = formData.purpose.trim();
      }
      if (formData.attendees !== reservation.attendees) {
        updates.attendees = formData.attendees;
      }
      if (formData.notes.trim()) {
        updates.notes = formData.notes.trim();
      }

      await updateReservationApi(reservation.id, updates);
      onSuccess();
    } catch (err) {
      console.error("Error al actualizar reserva:", err);
      setError(err.message || "Error al actualizar la reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'attendees' ? parseInt(value) || 1 : value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!reservation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Reserva #${reservation.id}`}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="edit-reservation-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="status">Estado *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`form-select ${validationErrors.status ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">Seleccionar estado</option>
              <option value="pendiente">Pendiente</option>
              <option value="activa">Activa</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            {validationErrors.status && (
              <span className="error-text">{validationErrors.status}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Propósito</label>
            <input
              type="text"
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Propósito de la reserva"
              className={`form-input ${validationErrors.purpose ? 'error' : ''}`}
              disabled={loading}
            />
            {validationErrors.purpose && (
              <span className="error-text">{validationErrors.purpose}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="attendees">Asistentes</label>
            <input
              type="number"
              id="attendees"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              min="1"
              max="100"
              className={`form-input ${validationErrors.attendees ? 'error' : ''}`}
              disabled={loading}
            />
            {validationErrors.attendees && (
              <span className="error-text">{validationErrors.attendees}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="startDateTime">Fecha y hora de inicio</label>
            <input
              type="datetime-local"
              id="startDateTime"
              name="startDateTime"
              value={formData.startDateTime}
              onChange={handleChange}
              className={`form-input ${validationErrors.startDateTime ? 'error' : ''}`}
              disabled={loading || reservation.status !== 'pendiente'}
            />
            {validationErrors.startDateTime && (
              <span className="error-text">{validationErrors.startDateTime}</span>
            )}
            {reservation.status !== 'pendiente' && (
              <small className="help-text">Solo se pueden modificar fechas en reservas pendientes</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="endDateTime">Fecha y hora de fin</label>
            <input
              type="datetime-local"
              id="endDateTime"
              name="endDateTime"
              value={formData.endDateTime}
              onChange={handleChange}
              className={`form-input ${validationErrors.endDateTime ? 'error' : ''}`}
              disabled={loading || reservation.status !== 'pendiente'}
            />
            {validationErrors.endDateTime && (
              <span className="error-text">{validationErrors.endDateTime}</span>
            )}
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Notas administrativas</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Agregar notas para esta edición..."
              rows="3"
              className="form-textarea"
              disabled={loading}
            />
            <small className="help-text">Las notas serán agregadas al historial de la reserva</small>
          </div>
        </div>

        <div className="form-summary">
          <h4>Resumen de cambios</h4>
          <ul>
            {formData.status !== reservation.status && (
              <li>
                <strong>Estado:</strong> {reservation.status} → {formData.status}
              </li>
            )}
            {formData.purpose !== reservation.purpose && (
              <li>
                <strong>Propósito:</strong> "{reservation.purpose}" → "{formData.purpose}"
              </li>
            )}
            {formData.attendees !== reservation.attendees && (
              <li>
                <strong>Asistentes:</strong> {reservation.attendees} → {formData.attendees}
              </li>
            )}
            {formData.startDateTime && formData.endDateTime && (
              <li>
                <strong>Horario:</strong> Cambio de fechas programado
              </li>
            )}
            {!Object.keys(formData).some(key => formData[key] !== (reservation[key] || '')) && (
              <li className="no-changes">No hay cambios pendientes</li>
            )}
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !Object.keys(formData).some(key => formData[key] !== (reservation[key] || ''))}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditReservationModal;