import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import { updateReservationApi } from "../../api/Reservation/reservationManagementApi";
import "./EditReservationModal.css";

const EditReservationModal = ({ isOpen, onClose, reservation, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (reservation) {
      setFormData({
        status: reservation.status,
        notes: ''
      });
    }
  }, [reservation]);

  const validateForm = () => {
    const errors = {};

    if (!formData.status) {
      errors.status = "El estado es requerido";
    }

    if (formData.notes && formData.notes.trim().length === 0) {
      errors.notes = "Las notas no pueden estar vacías";
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
      
      // Solo actualizamos el estado
      if (formData.status !== reservation.status) {
        updates.status = formData.status;
      }
      
      // Agregar notas solo si se proporcionan
      if (formData.notes.trim()) {
        updates.notes = formData.notes.trim();
      }

      // Si no hay cambios reales, no hacemos la llamada
      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateReservationApi(reservation.id, updates);
      onSuccess();
      onClose();
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
      [name]: value
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
      title={`Editar Estado de Reserva #${reservation.id}`}
      size="medium"
    >
      <form onSubmit={handleSubmit} className="edit-reservation-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="status">Estado Actual *</label>
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

          <div className="form-group full-width">
            <label htmlFor="notes">Notas del Cambio de Estado</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Motivo del cambio de estado o comentarios..."
              rows="3"
              className={`form-textarea ${validationErrors.notes ? 'error' : ''}`}
              disabled={loading}
            />
            {validationErrors.notes && (
              <span className="error-text">{validationErrors.notes}</span>
            )}
            <small className="help-text">
              Las notas serán registradas en el historial de la reserva
            </small>
          </div>
        </div>

        <div className="form-summary">
          <h4>Resumen de Cambios</h4>
          <ul>
            {formData.status !== reservation.status ? (
              <li>
                <strong>Estado:</strong> {reservation.status} → {formData.status}
              </li>
            ) : (
              <li className="no-changes">No hay cambios en el estado</li>
            )}
            
            {formData.notes.trim() && (
              <li>
                <strong>Notas:</strong> "{formData.notes}"
              </li>
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
            disabled={loading || formData.status === reservation.status}
          >
            {loading ? 'Actualizando...' : 'Actualizar Estado'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditReservationModal;