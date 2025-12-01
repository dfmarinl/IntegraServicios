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
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo estado para el término de búsqueda

  // Hook modular para reservas
  const { reserving, createQuickReservation, createReservationFromCalendar } = useReservation();

  useEffect(() => {
    if (unitId && typeId) {
      loadData();
    }
  }, [unitId, typeId]);

  // Nuevo efecto para filtrar recursos cuando cambia el término de búsqueda
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
      setFilteredResources(resourcesData); // Inicializar recursos filtrados
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

  const handleQuickReserve = async (resourceId, resourceType) => {
    const result = await createQuickReservation(resourceId, resourceType);
    
    if (result.success) {
      alert(`¡Reserva creada exitosamente!\nRecurso: ${result.data.reservation?.Resource?.name}\nFecha: ${new Date(result.data.reservation?.startDateTime).toLocaleString()}`);
    } else {
      alert(`Error al crear la reserva: ${result.error}`);
    }
  };

  const handleAdvancedReserve = (resourceId, resourceType, unit) => {
    const resource = resources.find(r => r.id === resourceId);
    setSelectedResource(resource);
    setShowCalendar(true);
  };

  // CORREGIDO: Usar la nueva función específica para calendario
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
        <h1>Recursos - {resourceType?.name}</h1>
        <p>{unit?.name} - Selecciona un recurso para reservar</p>
      </div>

      {/* Sección de búsqueda */}
      <div className="resources-search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar recurso por nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={handleClearSearch} className="clear-search-btn">
              ✕
            </button>
          )}
          <div className="search-results-info">
            {searchTerm && (
              <p>
                Mostrando {filteredResources.length} de {resources.length} recursos
                {searchTerm && ` para "${searchTerm}"`}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="resources-grid">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="resource-card">
              <div className="resource-image-container">
                <img
                  src={resource.photoUrl}
                  alt={resource.name}
                  className="resource-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-resource.jpg';
                  }}
                />
                <div className={`resource-availability-badge ${resource.isAvailable ? 'available' : 'unavailable'}`}>
                  {resource.isAvailable ? 'Disponible' : 'No disponible'}
                </div>
              </div>

              <div className="resource-content">
                <h3 className="resource-name">{resource.name}</h3>
                
                {resource.features && Object.keys(resource.features).length > 0 && (
                  <div className="resource-features">
                    <span className="features-label">Características:</span>
                    <div className="features-list">
                      {Object.entries(resource.features).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="feature-tag">
                          {key}: {value}
                        </span>
                      ))}
                      {Object.keys(resource.features).length > 3 && (
                        <span className="feature-tag-more">
                          +{Object.keys(resource.features).length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <ReservationActions
                  resource={resource}
                  resourceType={resourceType}
                  unit={unit}
                  onQuickReserve={handleQuickReserve}
                  onAdvancedReserve={handleAdvancedReserve}
                  isReserving={reserving}
                />
              </div>
            </Card>
          ))
        ) : (
          <div className="no-resources">
            <div className="no-resources-icon">🔍</div>
            <h3>No se encontraron recursos</h3>
            <p>
              {searchTerm 
                ? `No hay recursos que coincidan con "${searchTerm}"`
                : "No se encontraron recursos de este tipo"}
            </p>
            {searchTerm && (
              <button onClick={handleClearSearch} className="btn-clear-search">
                Limpiar búsqueda
              </button>
            )}
            <button onClick={handleBackClick} className="btn-back">
              Volver a tipos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesByTypeView;