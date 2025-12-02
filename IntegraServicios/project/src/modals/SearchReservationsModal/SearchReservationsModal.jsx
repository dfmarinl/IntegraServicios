import { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import { 
  getActiveResourceTypesByUnitApi 
} from "../../api/Resource/resourceType";
import { 
  getActiveUnitsApi 
} from "../../api/unit/units";
import "./SearchReservationsModal.css";

const SearchReservationsModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [searchCriteria, setSearchCriteria] = useState({
    query: '',
    status: '',
    unitId: '',
    resourceTypeId: '',
    isRepetitive: '',
    minAttendees: '',
    maxAttendees: '',
    startDate: '',
    endDate: ''
  });

  // Estados para datos dinámicos
  const [units, setUnits] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [loadingData, setLoadingData] = useState({
    units: false,
    resourceTypes: false
  });

  // Cargar unidades cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      fetchUnits();
    }
  }, [isOpen]);

  // Cargar tipos de recurso cuando cambia la unidad seleccionada
  useEffect(() => {
    if (searchCriteria.unitId) {
      fetchResourceTypesByUnit(searchCriteria.unitId);
    } else {
      // Si no hay unidad seleccionada, limpiar tipos de recurso
      setResourceTypes([]);
      // También limpiar la selección de tipo de recurso
      setSearchCriteria(prev => ({ ...prev, resourceTypeId: '' }));
    }
  }, [searchCriteria.unitId]);

  const fetchUnits = async () => {
    try {
      setLoadingData(prev => ({ ...prev, units: true }));
      const unitsData = await getActiveUnitsApi();
      setUnits(unitsData);
    } catch (error) {
      console.error('Error cargando unidades:', error);
    } finally {
      setLoadingData(prev => ({ ...prev, units: false }));
    }
  };

  const fetchResourceTypesByUnit = async (unitId) => {
    try {
      setLoadingData(prev => ({ ...prev, resourceTypes: true }));
      const resourceTypesData = await getActiveResourceTypesByUnitApi(unitId);
      setResourceTypes(resourceTypesData);
    } catch (error) {
      console.error('Error cargando tipos de recurso:', error);
      setResourceTypes([]);
    } finally {
      setLoadingData(prev => ({ ...prev, resourceTypes: false }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filtrar campos vacíos y preparar para el backend
    const filteredCriteria = {};
    
    Object.keys(searchCriteria).forEach(key => {
      const value = searchCriteria[key];
      
      // Solo incluir campos con valor
      if (value !== '' && value !== null && value !== undefined) {
        // Convertir tipos específicos según lo que espera el backend
        if (key === 'minAttendees' || key === 'maxAttendees') {
          filteredCriteria[key] = parseInt(value);
        } else if (key === 'isRepetitive') {
          filteredCriteria[key] = value === 'true';
        } else if (key === 'unitId' || key === 'resourceTypeId') {
          filteredCriteria[key] = parseInt(value);
        } else {
          filteredCriteria[key] = value;
        }
      }
    });
    
    // Si hay búsqueda por texto, limpiar espacios
    if (filteredCriteria.query) {
      filteredCriteria.query = filteredCriteria.query.trim();
    }
    
    // Enviar los criterios formateados
    onSubmit(filteredCriteria);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia la unidad, también debemos resetear el tipo de recurso
    if (name === 'unitId') {
      setSearchCriteria(prev => ({
        ...prev,
        unitId: value,
        resourceTypeId: '' // Resetear tipo de recurso
      }));
    } else {
      setSearchCriteria(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setSearchCriteria({
      query: '',
      status: '',
      unitId: '',
      resourceTypeId: '',
      isRepetitive: '',
      minAttendees: '',
      maxAttendees: '',
      startDate: '',
      endDate: ''
    });
    setResourceTypes([]);
  };

  // Función para obtener nombres de las opciones seleccionadas
  const getDisplayName = (key, value) => {
    switch (key) {
      case 'status':
        const statusMap = {
          'pendiente': 'Pendiente',
          'activa': 'Activa',
          'finalizada': 'Finalizada',
          'cancelada': 'Cancelada'
        };
        return statusMap[value] || value;
        
      case 'unitId':
        const unit = units.find(u => u.id.toString() === value);
        return unit ? unit.name : value;
        
      case 'resourceTypeId':
        const type = resourceTypes.find(t => t.id.toString() === value);
        return type ? type.name : value;
        
      case 'isRepetitive':
        return value === 'true' ? 'Repetitiva' : 'Única';
        
      default:
        return value;
    }
  };

  const getFieldLabel = (key) => {
    const labels = {
      query: 'Búsqueda',
      status: 'Estado',
      unitId: 'Unidad',
      resourceTypeId: 'Tipo de recurso',
      isRepetitive: 'Tipo de reserva',
      minAttendees: 'Mínimo de asistentes',
      maxAttendees: 'Máximo de asistentes',
      startDate: 'Fecha desde',
      endDate: 'Fecha hasta'
    };
    return labels[key] || key;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Búsqueda Avanzada de Reservas"
      size="large"
    >
      <form onSubmit={handleSubmit} className="search-reservations-form">
        <div className="search-section">
          <h4>Búsqueda por texto</h4>
          <div className="form-group">
            <input
              type="text"
              name="query"
              value={searchCriteria.query}
              onChange={handleChange}
              placeholder="Buscar por nombre de usuario, recurso, propósito..."
              className="search-input"
              disabled={loading}
            />
          </div>
        </div>

        <div className="search-grid">
          <div className="search-column">
            <h4>Filtros principales</h4>
            
            <div className="form-group">
              <label htmlFor="status">Estado</label>
              <select
                id="status"
                name="status"
                value={searchCriteria.status}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="activa">Activa</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="isRepetitive">Tipo de reserva</label>
              <select
                id="isRepetitive"
                name="isRepetitive"
                value={searchCriteria.isRepetitive}
                onChange={handleChange}
                className="form-select"
                disabled={loading}
              >
                <option value="">Todos los tipos</option>
                <option value="true">Repetitiva</option>
                <option value="false">Única</option>
              </select>
            </div>
          </div>

          <div className="search-column">
            <h4>Filtros por ubicación</h4>
            
            <div className="form-group">
              <label htmlFor="unitId">Unidad</label>
              <select
                id="unitId"
                name="unitId"
                value={searchCriteria.unitId}
                onChange={handleChange}
                className="form-select"
                disabled={loading || loadingData.units}
              >
                <option value="">Seleccionar unidad</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </select>
              {loadingData.units && <small>Cargando unidades...</small>}
            </div>

            <div className="form-group">
              <label htmlFor="resourceTypeId">Tipo de recurso</label>
              <select
                id="resourceTypeId"
                name="resourceTypeId"
                value={searchCriteria.resourceTypeId}
                onChange={handleChange}
                className="form-select"
                disabled={!searchCriteria.unitId || loading || loadingData.resourceTypes}
              >
                <option value="">{searchCriteria.unitId ? 'Seleccionar tipo' : 'Primero seleccione una unidad'}</option>
                {resourceTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {loadingData.resourceTypes && <small>Cargando tipos de recurso...</small>}
              {searchCriteria.unitId && resourceTypes.length === 0 && !loadingData.resourceTypes && (
                <small className="help-text">No hay tipos de recurso disponibles para esta unidad</small>
              )}
            </div>
          </div>

          <div className="search-column">
            <h4>Filtros por asistentes</h4>
            
            <div className="form-group">
              <label htmlFor="minAttendees">Mínimo de asistentes</label>
              <input
                type="number"
                id="minAttendees"
                name="minAttendees"
                value={searchCriteria.minAttendees}
                onChange={handleChange}
                min="1"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxAttendees">Máximo de asistentes</label>
              <input
                type="number"
                id="maxAttendees"
                name="maxAttendees"
                value={searchCriteria.maxAttendees}
                onChange={handleChange}
                min="1"
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="search-section">
          <h4>Filtros por fecha</h4>
          <div className="date-filters">
            <div className="form-group">
              <label htmlFor="startDate">Fecha desde</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={searchCriteria.startDate}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Fecha hasta</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={searchCriteria.endDate}
                onChange={handleChange}
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>
          <small className="help-text">
            Buscar reservas en el rango de fechas seleccionado. Dejar vacío para todas las fechas.
          </small>
        </div>

        <div className="search-preview">
          <h4>Vista previa de criterios</h4>
          <div className="criteria-list">
            {Object.entries(searchCriteria)
              .filter(([_, value]) => value !== '' && value !== null && value !== undefined)
              .map(([key, value]) => (
                <div key={key} className="criterion">
                  <span className="criterion-key">{getFieldLabel(key)}:</span>
                  <span className="criterion-value">{getDisplayName(key, value)}</span>
                </div>
              ))
            }
            {Object.values(searchCriteria).every(value => value === '' || value === null || value === undefined) && (
              <div className="no-criteria">
                No hay criterios de búsqueda seleccionados
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={resetForm}
            className="btn-outline"
            disabled={loading || loadingData.units || loadingData.resourceTypes}
          >
            Limpiar filtros
          </button>
          <div className="action-buttons">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={loading || loadingData.units || loadingData.resourceTypes}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || loadingData.units || loadingData.resourceTypes}
            >
              {loading ? 'Buscando...' : 'Buscar reservas'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default SearchReservationsModal;