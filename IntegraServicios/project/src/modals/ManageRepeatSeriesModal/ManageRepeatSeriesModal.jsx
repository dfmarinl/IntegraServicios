import { useState } from "react";
import Modal from "../../components/common/Modal";
import "./ManageRepeatSeriesModal.css";

const ManageRepeatSeriesModal = ({ isOpen, onClose, onConfirm, reservation, loading }) => {
  const [action, setAction] = useState('cancel');
  const [updateAll, setUpdateAll] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [updates, setUpdates] = useState({
    status: 'cancelada',
    adminNotes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const config = { updateAll };
    
    if (action === 'cancel' && startDate) {
      config.startDate = startDate;
    }
    
    if (action === 'update' && updateAll) {
      config.updates = updates;
    }
    
    onConfirm(action, config);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!reservation) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Serie Repetitiva"
      size="medium"
    >
      <div className="series-info">
        <p><strong>Serie:</strong> {reservation.purpose}</p>
        <p><strong>Recurso:</strong> {reservation.Resource?.name}</p>
        <p><strong>Usuario:</strong> {reservation.User?.firstName} {reservation.User?.lastName}</p>
        <p><strong>Fecha próxima:</strong> {formatDate(reservation.startDateTime)}</p>
      </div>

      <form onSubmit={handleSubmit} className="manage-series-form">
        <div className="form-section">
          <h4>Acción a realizar</h4>
          <div className="action-options">
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
                <span className="action-title">Cancelar</span>
                <span className="action-description">Cancelar reservas de la serie</span>
              </div>
            </label>

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
                <span className="action-title">Actualizar</span>
                <span className="action-description">Modificar todas las reservas</span>
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={updateAll}
              onChange={(e) => setUpdateAll(e.target.checked)}
              disabled={loading}
            />
            <span>Aplicar a toda la serie</span>
          </label>
          <small className="help-text">
            {updateAll 
              ? "La acción se aplicará a todas las reservas de la serie"
              : "La acción se aplicará solo a esta reserva"
            }
          </small>
        </div>

        {action === 'cancel' && updateAll && (
          <div className="form-section">
            <label htmlFor="startDate">Cancelar desde fecha (opcional)</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
            <small className="help-text">
              Dejar en blanco para cancelar todas las reservas de la serie
            </small>
          </div>
        )}

        {action === 'update' && updateAll && (
          <div className="form-section">
            <h4>Actualizaciones a aplicar</h4>
            <div className="form-group">
              <label htmlFor="status">Nuevo estado</label>
              <select
                id="status"
                value={updates.status}
                onChange={(e) => setUpdates(prev => ({ ...prev, status: e.target.value }))}
                className="form-select"
                disabled={loading}
              >
                <option value="pendiente">Pendiente</option>
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="adminNotes">Notas (opcional)</label>
              <textarea
                id="adminNotes"
                value={updates.adminNotes}
                onChange={(e) => setUpdates(prev => ({ ...prev, adminNotes: e.target.value }))}
                placeholder="Notas para todas las reservas actualizadas..."
                rows="3"
                className="form-textarea"
                disabled={loading}
              />
            </div>
          </div>
        )}

        <div className="confirmation-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <strong>Esta acción no se puede deshacer</strong>
            <p>
              {action === 'cancel' 
                ? `Se ${updateAll ? 'cancelarán todas' : 'cancelará esta'} reserva${updateAll ? 's' : ''} de la serie.`
                : `Se ${updateAll ? 'actualizarán todas' : 'actualizará esta'} reserva${updateAll ? 's' : ''} de la serie.`
              }
            </p>
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
            disabled={loading}
          >
            {loading ? 'Procesando...' : action === 'cancel' ? 'Confirmar Cancelación' : 'Confirmar Actualización'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ManageRepeatSeriesModal;