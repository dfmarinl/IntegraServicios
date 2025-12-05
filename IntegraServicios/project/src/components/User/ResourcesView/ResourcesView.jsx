import { useState, useEffect } from "react";
import { getActiveResourcesApi } from "../../../api/Resource/Resource"; // Usar getActiveResourcesApi
import { getActiveResourceTypesApi } from "../../../api/Resource/resourceType";
import Card from "../../common/Card";
import "./ResourcesView.css";

const ResourcesView = () => {
  const [resources, setResources] = useState([]);
  const [resourceTypes, setResourceTypes] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, searchTerm, selectedType, selectedAvailability, selectedDate, sortBy]);

  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar recursos activos directamente desde la API
      const activeResources = await getActiveResourcesApi();
      
      // Cargar tipos de recurso activos
      const typesData = await getActiveResourceTypesApi();

      setResources(activeResources);
      setResourceTypes(typesData);
      setFilteredResources(activeResources);
    } catch (err) {
      console.error("Error al cargar recursos:", err);
      setError("Error al cargar los recursos disponibles");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...resources];

    // Filtro por búsqueda de nombre (coincidencia parcial)
    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo de recurso
    if (selectedType) {
      filtered = filtered.filter(resource =>
        resource.typeId === parseInt(selectedType)
      );
    }

    // Filtro por disponibilidad
    if (selectedAvailability) {
      const isAvailable = selectedAvailability === "available";
      filtered = filtered.filter(resource => resource.isAvailable === isAvailable);
    }

    // Filtro por fecha (aquí podrías integrar con la disponibilidad real por fecha)
    if (selectedDate) {
      // Por ahora filtramos recursos disponibles en general
      // En una implementación real, aquí verificarías la disponibilidad para la fecha específica
      filtered = filtered.filter(resource => resource.isAvailable);
    }

    // Ordenar resultados
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          const typeA = resourceTypes.find(t => t.id === a.typeId)?.name || "";
          const typeB = resourceTypes.find(t => t.id === b.typeId)?.name || "";
          return typeA.localeCompare(typeB);
        case "availability":
          return (b.isAvailable === a.isAvailable) ? 0 : b.isAvailable ? 1 : -1;
        default:
          return 0;
      }
    });

    setFilteredResources(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedAvailability("");
    setSelectedDate("");
    setSortBy("name");
  };

  const getResourceTypeName = (typeId) => {
    const type = resourceTypes.find(t => t.id === typeId);
    return type ? type.name : "Tipo no especificado";
  };

  const getResourceUnit = (typeId) => {
    const type = resourceTypes.find(t => t.id === typeId);
    return type?.unit ? type.unit.name : "Unidad no especificada";
  };

  if (loading) {
    return (
      <div className="resources-loading">
        <div className="loading-spinner"></div>
        <p>Cargando recursos disponibles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resources-error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar recursos</h3>
        <p>{error}</p>
        <button onClick={loadResources} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="resources-view">
      <div className="resources-header">
        <h1>Recursos Disponibles</h1>
        <p>Encuentra y reserva los recursos que necesitas</p>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="filters-card">
        <div className="filters-header">
          <h3>Filtrar Recursos</h3>
          <button 
            onClick={handleClearFilters}
            className="clear-filters-btn"
            disabled={!searchTerm && !selectedType && !selectedAvailability && !selectedDate}
          >
            Limpiar filtros
          </button>
        </div>

        <div className="filters-grid">
          {/* Búsqueda por nombre */}
          <div className="filter-group">
            <label htmlFor="search" className="filter-label">
              Buscar por nombre
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: Computadora, Proyector..."
              className="filter-input"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="filter-group">
            <label htmlFor="type" className="filter-label">
              Tipo de recurso
            </label>
            <select
              id="type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="">Todos los tipos</option>
              {resourceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por disponibilidad */}
          <div className="filter-group">
            <label htmlFor="availability" className="filter-label">
              Disponibilidad
            </label>
            <select
              id="availability"
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas</option>
              <option value="available">Disponibles</option>
              <option value="unavailable">No disponibles</option>
            </select>
          </div>

          {/* Filtro por fecha */}
          <div className="filter-group">
            <label htmlFor="date" className="filter-label">
              Fecha específica
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="filter-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Ordenamiento */}
          <div className="filter-group">
            <label htmlFor="sort" className="filter-label">
              Ordenar por
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="type">Tipo de recurso</option>
              <option value="availability">Disponibilidad</option>
            </select>
          </div>
        </div>

        {/* Información de resultados */}
        <div className="results-info">
          <p>
            {filteredResources.length} recurso(s) encontrado(s)
            {(searchTerm || selectedType || selectedAvailability || selectedDate) && 
              " con los filtros aplicados"
            }
          </p>
        </div>
      </Card>

      {/* Lista de recursos */}
      <div className="resources-grid">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <Card key={resource.id} className="resource-card">
              {/* Imagen del recurso */}
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

              {/* Información del recurso */}
              <div className="resource-content">
                <h3 className="resource-name">{resource.name}</h3>
                
                <div className="resource-meta">
                  <div className="resource-type">
                    <span className="meta-label">Tipo:</span>
                    <span className="meta-value">{getResourceTypeName(resource.typeId)}</span>
                  </div>
                  
                  <div className="resource-unit">
                    <span className="meta-label">Unidad:</span>
                    <span className="meta-value">{getResourceUnit(resource.typeId)}</span>
                  </div>
                </div>

                {/* Características */}
                {resource.features && Object.keys(resource.features).length > 0 && (
                  <div className="resource-features">
                    <span className="meta-label">Características:</span>
                    <div className="features-list">
                      {Object.entries(resource.features).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="feature-tag">
                          {key}: {value}
                        </span>
                      ))}
                      {Object.keys(resource.features).length > 3 && (
                        <span className="feature-more">
                          +{Object.keys(resource.features).length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="resource-actions">
                  <button 
                    className={`btn-reserve ${!resource.isAvailable ? 'btn-disabled' : ''}`}
                    disabled={!resource.isAvailable}
                    onClick={() => {
                      // Aquí iría la lógica para reservar
                      console.log('Reservar recurso:', resource.id);
                    }}
                  >
                    {resource.isAvailable ? 'Reservar' : 'No disponible'}
                  </button>
                  
                  <button 
                    className="btn-details"
                    onClick={() => {
                      // Aquí iría la navegación a detalles del recurso
                      console.log('Ver detalles:', resource.id);
                    }}
                  >
                    Ver detalles
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
              {searchTerm || selectedType || selectedAvailability || selectedDate 
                ? "Intenta ajustar los filtros de búsqueda"
                : "No hay recursos disponibles en este momento"
              }
            </p>
            {(searchTerm || selectedType || selectedAvailability || selectedDate) && (
              <button onClick={handleClearFilters} className="btn-clear-search">
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesView;