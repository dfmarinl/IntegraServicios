import { useState } from "react";
import Modal from "../../components/common/Modal";
import "./GenerateReportModal.css";

const GenerateReportModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [reportConfig, setReportConfig] = useState({
    startDate: '',
    endDate: '',
    format: 'json',
    unitId: '',
    resourceTypeId: '',
    includeDetails: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar fechas
    if (reportConfig.startDate && reportConfig.endDate) {
      const start = new Date(reportConfig.startDate);
      const end = new Date(reportConfig.endDate);
      
      if (start > end) {
        alert('La fecha de inicio debe ser anterior a la fecha de fin');
        return;
      }
    }
    
    onSubmit(reportConfig);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setReportConfig({
      startDate: '',
      endDate: '',
      format: 'json',
      unitId: '',
      resourceTypeId: '',
      includeDetails: true
    });
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'Formato estructurado para análisis' },
    { value: 'csv', label: 'CSV', description: 'Hoja de cálculo (Excel, Google Sheets)' },
    { value: 'pdf', label: 'PDF', description: 'Documento imprimible (próximamente)' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar Reporte de Reservas"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="generate-report-form">
        <div className="report-section">
          <h4>Rango de fechas</h4>
          <div className="date-range">
            <div className="form-group">
              <label htmlFor="startDate">Fecha inicio *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={reportConfig.startDate}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Fecha fin *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={reportConfig.endDate}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
                required
              />
            </div>
          </div>
          <small className="help-text">
            El reporte incluirá todas las reservas dentro de este rango de fechas
          </small>
        </div>

        <div className="report-section">
          <h4>Formato del reporte</h4>
          <div className="format-options">
            {formatOptions.map(option => (
              <label key={option.value} className="format-option">
                <input
                  type="radio"
                  name="format"
                  value={option.value}
                  checked={reportConfig.format === option.value}
                  onChange={handleChange}
                  disabled={loading || option.value === 'pdf'}
                  className="format-radio"
                />
                <div className="format-content">
                  <div className="format-header">
                    <span className="format-label">{option.label}</span>
                    {option.value === 'pdf' && (
                      <span className="format-badge">Próximamente</span>
                    )}
                  </div>
                  <span className="format-description">{option.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h4>Filtros adicionales (opcionales)</h4>
          <div className="additional-filters">
            <div className="form-group">
              <label htmlFor="unitId">Unidad</label>
              <select
                id="unitId"
                name="unitId"
                value={reportConfig.unitId}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
              >
                <option value="">Todas las unidades</option>
                <option value="1">Facultad de Ingeniería</option>
                <option value="2">Facultad de Ciencias</option>
                <option value="3">Biblioteca Central</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="resourceTypeId">Tipo de recurso</label>
              <select
                id="resourceTypeId"
                name="resourceTypeId"
                value={reportConfig.resourceTypeId}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
              >
                <option value="">Todos los tipos</option>
                <option value="1">Aula</option>
                <option value="2">Laboratorio</option>
                <option value="3">Auditorio</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="includeDetails"
                  checked={reportConfig.includeDetails}
                  onChange={handleChange}
                  disabled={loading}
                />
                <span>Incluir detalles completos</span>
              </label>
              <small className="help-text">
                Incluye información detallada de cada reserva en el reporte
              </small>
            </div>
          </div>
        </div>

        <div className="report-preview">
          <h4>Resumen del reporte</h4>
          <div className="preview-content">
            <div className="preview-item">
              <span className="preview-label">Período:</span>
              <span className="preview-value">
                {reportConfig.startDate && reportConfig.endDate 
                  ? `${reportConfig.startDate} - ${reportConfig.endDate}`
                  : 'No especificado'
                }
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Formato:</span>
              <span className="preview-value">{reportConfig.format.toUpperCase()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Filtros aplicados:</span>
              <span className="preview-value">
                {reportConfig.unitId || reportConfig.resourceTypeId 
                  ? `${reportConfig.unitId ? 'Por unidad ' : ''}${reportConfig.resourceTypeId ? 'Por tipo de recurso' : ''}`
                  : 'Ninguno'
                }
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Detalles:</span>
              <span className="preview-value">
                {reportConfig.includeDetails ? 'Incluidos' : 'Resumen solamente'}
              </span>
            </div>
          </div>
        </div>

        <div className="report-notice">
          <div className="notice-icon">ℹ️</div>
          <div className="notice-content">
            <strong>Información importante</strong>
            <ul>
              <li>El reporte se generará y descargará automáticamente</li>
              <li>Formatos JSON y CSV incluyen todos los datos</li>
              <li>El formato PDF está actualmente en desarrollo</li>
              <li>Los reportes grandes pueden tomar varios segundos en generarse</li>
            </ul>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn-outline"
            disabled={loading}
          >
            Reiniciar
          </button>
          <div className="action-buttons">
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
              disabled={loading || !reportConfig.startDate || !reportConfig.endDate}
            >
              {loading ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default GenerateReportModal;