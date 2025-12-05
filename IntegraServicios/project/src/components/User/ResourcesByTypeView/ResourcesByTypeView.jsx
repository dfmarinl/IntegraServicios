import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getActiveResourcesByTypeApi } from "../../../api/Resource/Resource";
import { getResourceTypeApi } from "../../../api/Resource/resourceType";
import { getUnitApi } from "../../../api/unit/units";
import { useReservation } from "./hooks/useReservation";
import ReservationActions from "./components/ReservationActions";
import ReservationCalendar from "./components/ReservationCalendar";
import Card from "../../common/Card";
import "./ResourcesByTypeView.css";

const ResourcesByTypeView = () => {
  const { unitId, typeId } = useParams();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [resourceType, setResourceType] = useState(null);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Hook modular para reservas
  const { reserving, createReservationFromCalendar } = useReservation();

  useEffect(() => {
    if (unitId && typeId) {
      loadData();
    }
  }, [unitId, typeId]);

  // Efecto para filtrar recursos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredResources(resources);
    } else {
      const filtered = resources.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResources(filtered);
    }
  }, [searchTerm, resources]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const unitData = await getUnitApi(unitId);
      setUnit(unitData);

      const typeData = await getResourceTypeApi(typeId);
      setResourceType(typeData);

      const resourcesData = await getActiveResourcesByTypeApi(typeId);
      setResources(resourcesData);
      setFilteredResources(resourcesData);
    } catch (err) {
      console.error("Error al cargar recursos:", err);
      setError("Error al cargar los recursos disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    if (showCalendar) {
      setShowCalendar(false);
      setSelectedResource(null);
    } else {
      navigate(`/app/resources/browse/unit/${unitId}/types`);
    }
  };

  // Función para reservar desde calendario
  const handleReserve = (resourceId) => {
    const resource = resources.find(r => r.id === resourceId);
    if (resource) {
      setSelectedResource(resource);
      setShowCalendar(true);
    }
  };

  // Crear reserva desde calendario
  const handleCreateReservationFromCalendar = async (reservationData) => {
    try {
      const result = await createReservationFromCalendar(reservationData);
      
      if (result.success) {
        alert(`¡Reserva creada exitosamente!\nRecurso: ${result.data.reservation?.Resource?.name}\nFecha: ${new Date(result.data.reservation?.startDateTime).toLocaleString()}`);
        setShowCalendar(false);
        setSelectedResource(null);
      } else {
        alert(`Error al crear la reserva: ${result.error}`);
      }
    } catch (error) {
      alert(`Error al crear la reserva: ${error.message}`);
    }
  };

  const handleCancelCalendar = () => {
    setShowCalendar(false);
    setSelectedResource(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="resources-loading">
        <div className="loading-spinner"></div>
        <p>Cargando recursos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resources-error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar recursos</h3>
        <p>{error}</p>
        <button onClick={loadData} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  // Mostrar calendario de reservas
  if (showCalendar && selectedResource) {
    return (
      <ReservationCalendar
        resource={selectedResource}
        resourceType={resourceType}
        unit={unit}
        onCreateReservation={handleCreateReservationFromCalendar}
        onCancel={handleCancelCalendar}
      />
    );
  }

  // Mostrar lista de recursos
  return (
    <div className="resources-by-type-view">
      <div className="resources-header">
        <button onClick={handleBackClick} className="back-button">
          ← Volver a {showCalendar ? 'Recursos' : 'Tipos'}
        </button>
        <div className="resources-title-container">
          <h1 className="resources-title">Recursos - {resourceType?.name}</h1>
          <p className="resources-subtitle">{unit?.name} - Selecciona un recurso para reservar</p>
          <div className="type-badge">
            <span className="type-badge-icon">{resourceType?.icon || '📦'}</span>
            <span>{resourceType?.description || 'Recursos disponibles'}</span>
          </div>
        </div>
      </div>

      {/* Tarjeta de filtros y búsqueda */}
      <Card className="filters-card">
        <div className="filters-header">
          <h3>Filtrar Recursos</h3>
          {searchTerm && (
            <button 
              onClick={handleClearSearch} 
              className="clear-filters-btn"
              disabled={!searchTerm}
            >
              Limpiar Búsqueda
            </button>
          )}
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">🔍 Buscar por nombre</label>
            <input
              type="text"
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="filter-input"
            />
          </div>
        </div>

        <div className="results-info">
          <div className="results-count">
            {filteredResources.length} de {resources.length} recursos
          </div>
          <div className="results-stats">
            <span>
              ✅ {resources.filter(r => r.isAvailable).length} disponibles
            </span>
            <span>
              ⚠️ {resources.filter(r => !r.isAvailable).length} ocupados
            </span>
          </div>
        </div>
      </Card>

      <div className="resources-grid">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="resource-card">
              <div className="resource-image-container">
                <img
                  src={resource.photoUrl || '/placeholder-resource.jpg'}
                  alt={resource.name}
                  className="resource-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-resource.jpg';
                  }}
                />
                <div className={`resource-availability-badge ${resource.isAvailable ? 'available' : 'unavailable'}`}>
                  {resource.isAvailable ? '✅ Disponible' : '⛔ Ocupado'}
                </div>
              </div>

              <div className="resource-content">
                <h3 className="resource-name">{resource.name}</h3>
                
                {/* Meta información del recurso */}
                <div className="resource-meta">
                  <div className="meta-item">
                    <span className="meta-label">Capacidad</span>
                    <span className="meta-value">{resource.capacity || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Ubicación</span>
                    <span className="meta-value">{resource.location || unit?.name || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Tipo</span>
                    <span className="meta-value">{resourceType?.name || 'N/A'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Unidad</span>
                    <span className="meta-value">{unit?.name || 'N/A'}</span>
                  </div>
                </div>

                {/* Características */}
                {resource.features && Object.keys(resource.features).length > 0 && (
                  <div className="resource-features">
                    <span className="features-label">✨ Características:</span>
                    <div className="features-list">
                      {Object.entries(resource.features).slice(0, 4).map(([key, value]) => (
                        <span key={key} className="feature-tag">
                          {value === true ? key : `${key}: ${value}`}
                        </span>
                      ))}
                      {Object.keys(resource.features).length > 4 && (
                        <span className="feature-tag feature-more">
                          +{Object.keys(resource.features).length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Acciones - Solo botón de Reservar */}
                <div className="resource-actions">
                  <button
                    onClick={() => handleReserve(resource.id)}
                    disabled={!resource.isAvailable || reserving}
                    className={`btn-reserve ${!resource.isAvailable ? 'btn-disabled' : ''}`}
                  >
                    {reserving && selectedResource?.id === resource.id ? (
                      'Reservando...'
                    ) : resource.isAvailable ? (
                      '📅 Reservar'
                    ) : (
                      'No disponible'
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No se encontraron recursos</h3>
            <p>
              {searchTerm 
                ? `No hay recursos que coincidan con "${searchTerm}"`
                : "No hay recursos disponibles de este tipo"}
            </p>
            {searchTerm ? (
              <button onClick={handleClearSearch} className="btn-clear-search">
                Limpiar búsqueda
              </button>
            ) : (
              <button onClick={handleBackClick} className="btn-clear-search">
                Volver a tipos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesByTypeView;