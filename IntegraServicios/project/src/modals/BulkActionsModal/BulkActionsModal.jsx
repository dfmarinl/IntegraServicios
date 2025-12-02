import { useState } from "react";
import Modal from "../../components/common/Modal";
import "./BulkActionsModal.css";

const BulkActionsModal = ({ isOpen, onClose, onConfirm, selectedCount, loading }) => {
  const [action, setAction] = useState('update');
  const [updates, setUpdates] = useState({
    status: '',
    adminNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que haya un estado seleccionado para actualización
    if (action === 'update' && !updates.status) {
      alert('Por favor seleccione un estado para la actualización');
      return;
    }
    
    onConfirm(action, updates);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Acciones Masivas"
      size="medium"
    >
      <div className="bulk-actions-header">
        <div className="selected-count">
          <span className="count-number">{selectedCount}</span>
          <span className="count-label">reserva(s) seleccionada(s)</span>
        </div>
        <p className="header-description">
          Aplicar la misma acción a todas las reservas seleccionadas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bulk-actions-form">
        <div className="action-section">
          <h4>Seleccione la acción</h4>
          <div className="action-options">
            <label className="action-option">
              <input
                type="radio"
                name="action"
                value="update"
                checked={action === 'update'}
                onChange={(e) => setAction(e.target.value)}
                disabled={loading}
              />
              <div className="action-content">
                <span className="action-title">Actualizar estado</span>
                <span className="action-description">Cambiar el estado de las reservas</span>
              </div>
            </label>

            <label className="action-option">
              <input
                type="radio"
                name="action"
                value="cancel"
                checked={action === 'cancel'}
                onChange={(e) => setAction(e.target.value)}
                disabled={loading}
              />
              <div className="action-content">
                <span className="action-title">Cancelar reservas</span>
                <span className="action-description">Cancelar todas las reservas seleccionadas</span>
              </div>
            </label>
          </div>
        </div>

        {action === 'update' && (
          <div className="update-section">
            <h4>Configuración de actualización</h4>
            <div className="form-group">
              <label htmlFor="status">Nuevo estado *</label>
              <select
                id="status"
                name="status"
                value={updates.status}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
                required
              >
                <option value="">Seleccionar estado</option>
                <option value="pendiente">Pendiente</option>
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="adminNotes">Notas administrativas (opcional)</label>
              <textarea
                id="adminNotes"
                name="adminNotes"
                value={updates.adminNotes}
                onChange={handleChange}
                placeholder="Notas para todas las reservas actualizadas..."
                rows="3"
                className="form-textarea"
                disabled={loading}
              />
              <small className="help-text">
                Estas notas se agregarán al historial de cada reserva
              </small>
            </div>
          </div>
        )}

        {action === 'cancel' && (
          <div className="cancel-section">
            <div className="confirmation-warning">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <strong>Confirmar cancelación masiva</strong>
                <p>
                  Se cancelarán {selectedCount} reserva(s). Esta acción no se puede deshacer.
                  Las reservas canceladas no podrán ser reactivadas.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="summary-section">
          <h4>Resumen de la acción</h4>
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Acción:</span>
              <span className="summary-value">
                {action === 'update' ? 'Actualización' : 'Cancelación'}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Reservas afectadas:</span>
              <span className="summary-value">{selectedCount}</span>
            </div>
            {action === 'update' && updates.status && (
              <div className="summary-item">
                <span className="summary-label">Nuevo estado:</span>
                <span className="summary-value">{updates.status}</span>
              </div>
            )}
            {action === 'update' && updates.adminNotes && (
              <div className="summary-item">
                <span className="summary-label">Con notas:</span>
                <span className="summary-value">Sí</span>
              </div>
            )}
          </div>
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
            className={`btn-primary ${action === 'cancel' ? 'btn-danger' : ''}`}
            disabled={loading || (action === 'update' && !updates.status)}
          >
            {loading 
              ? 'Procesando...' 
              : action === 'cancel' 
                ? `Cancelar ${selectedCount} reserva(s)`
                : `Actualizar ${selectedCount} reserva(s)`
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkActionsModal;