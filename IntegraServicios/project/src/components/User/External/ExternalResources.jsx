import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import {
  getSpaces,
  getCategoryIcon,
  getCategoryColor,
  getStatusBadge,
  formatCapacity
} from '../../../api/integracion/waysoft-api-client';
import './ExternalResources.css';

const ExternalResources = () => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    tipo: 'todos',
    capacidadMin: '',
    search: ''
  });
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando espacios desde ReservasPro...');
      const result = await getSpaces(filters);
      
      console.log('📊 Resultado de getSpaces:', result);
      
      if (result.success) {
        setSpaces(result.data || []);
        
        // Calcular estadísticas
        const statsData = {
          total: result.data.length,
          byType: {},
          totalCapacity: 0
        };
        
        result.data.forEach(space => {
          // Conteo por tipo
          if (!statsData.byType[space.tipo]) {
            statsData.byType[space.tipo] = 0;
          }
          statsData.byType[space.tipo]++;
          
          // Capacidad total
          statsData.totalCapacity += space.capacidad;
        });
        
        setStats(statsData);
        
        if (result.data && result.data.length === 0) {
          setError('No se encontraron espacios con los filtros aplicados');
        }
      } else {
        setError(`Error al cargar espacios: ${result.error}`);
      }
      
    } catch (err) {
      console.error('❌ Error en loadSpaces:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/app/resources/browse');
  };

  const handleSpaceClick = (space) => {
    console.log('🔍 Espacio clickeado:', space);
    setSelectedSpace(space);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSpace(null);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadSpaces();
  };

  const handleResetFilters = () => {
    setFilters({
      tipo: 'todos',
      capacidadMin: '',
      search: ''
    });
    // Recargar sin filtros después de un breve delay
    setTimeout(() => loadSpaces(), 100);
  };

  // Función para obtener el estado simulado (para demostración)
  const getSpaceStatus = (space) => {
    // Simulamos diferentes estados basados en el ID
    const statuses = ['available', 'occupied', 'maintenance'];
    const status = statuses[space.id % 3];
    
    return getStatusBadge(status);
  };

  // Obtener tipos únicos para el filtro
  const uniqueTypes = [...new Set(spaces.map(space => space.tipo))];

  return (
    <div className="external-resources">
      <div className="external-header">
        <button onClick={handleBackClick} className="back-button">
          ← Volver a Recursos
        </button>
        <div className="header-content">
          <h1>🏢 ReservasPro - Espacios Académicos</h1>
          <p>Gestión centralizada de aulas, laboratorios y auditorios</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="filters-card">
        <div className="filters-header">
          <h3>🔍 Filtrar Espacios</h3>
          <button 
            onClick={handleResetFilters}
            className="reset-filters-btn"
          >
            Limpiar filtros
          </button>
        </div>
        
        <form onSubmit={handleFilterSubmit} className="filters-form">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="tipo">Tipo de Espacio</label>
              <select
                id="tipo"
                name="tipo"
                value={filters.tipo}
                onChange={handleFilterChange}
              >
                <option value="todos">Todos los tipos</option>
                {uniqueTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="capacidadMin">Capacidad Mínima</label>
              <input
                type="number"
                id="capacidadMin"
                name="capacidadMin"
                value={filters.capacidadMin}
                onChange={handleFilterChange}
                placeholder="Ej: 20"
                min="1"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="search">Buscar</label>
              <input
                type="text"
                id="search"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Nombre o descripción..."
              />
            </div>
            
            <div className="filter-group">
              <label>&nbsp;</label>
              <button type="submit" className="apply-filters-btn">
                Aplicar Filtros
              </button>
            </div>
          </div>
        </form>
        
        {/* Estadísticas */}
        {stats && (
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-label">Total Espacios:</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Capacidad Total:</span>
              <span className="stat-value">{stats.totalCapacity} personas</span>
            </div>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="stat-item">
                <span className="stat-label">
                  <span 
                    className="stat-icon"
                    style={{ color: getCategoryColor(type) }}
                  >
                    {getCategoryIcon(type)}
                  </span>
                  {type}:
                </span>
                <span className="stat-value">{count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando espacios desde ReservasPro...</p>
        </div>
      ) : error ? (
        <Card className="error-card">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Error</h3>
            <p className="error-message">{error}</p>
            <button 
              onClick={loadSpaces} 
              className="btn-retry"
            >
              Reintentar
            </button>
            <div className="error-tips">
              <p>💡 Sugerencias:</p>
              <ul>
                <li>Verifica tu conexión a internet</li>
                <li>Visita https://www.reservaspro.xyz/espacios en tu navegador</li>
                <li>Intenta con filtros diferentes</li>
              </ul>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <div className="spaces-header">
            <h2>Espacios Disponibles ({spaces.length})</h2>
            <p>Haz clic en un espacio para ver más detalles</p>
          </div>

          {/* Mostrar espacios agrupados por tipo */}
          {Object.entries(spaces.reduce((groups, space) => {
            if (!groups[space.tipo]) {
              groups[space.tipo] = [];
            }
            groups[space.tipo].push(space);
            return groups;
          }, {})).map(([tipo, tipoSpaces]) => (
            <div key={tipo} className="space-type-section">
              <div className="type-header">
                <span 
                  className="type-icon"
                  style={{ color: getCategoryColor(tipo) }}
                >
                  {getCategoryIcon(tipo)}
                </span>
                <h3>{tipo} ({tipoSpaces.length})</h3>
              </div>
              
              <div className="spaces-grid">
                {tipoSpaces.map((space) => {
                  const status = getSpaceStatus(space);
                  const spaceColor = getCategoryColor(space.tipo);
                  const spaceIcon = getCategoryIcon(space.tipo);
                  
                  return (
                    <Card 
                      key={space.id} 
                      className="space-card"
                    >
                      <div className="space-card-content">
                        <div className="space-card-header">
                          <div 
                            className="space-icon"
                            style={{ color: spaceColor }}
                          >
                            {spaceIcon}
                          </div>
                          <div className="space-header-info">
                            <h3 className="space-name">{space.nombre}</h3>
                            <div className="space-codes">
                              <span className="space-id">ID: {space.id}</span>
                              <span 
                                className="space-status"
                                style={{ 
                                  backgroundColor: `${status.color}15`,
                                  color: status.color,
                                  borderColor: `${status.color}30`
                                }}
                              >
                                {status.icon} {status.text}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="space-description">
                          {space.descripcion}
                        </p>
                        
                        <div className="space-meta">
                          <span 
                            className="space-type-badge"
                            style={{ 
                              backgroundColor: `${spaceColor}15`,
                              color: spaceColor,
                              borderColor: `${spaceColor}30`
                            }}
                          >
                            {spaceIcon} {space.tipo}
                          </span>
                          <span className="space-capacity">
                            👥 {formatCapacity(space.capacidad)}
                          </span>
                        </div>
                        
                        {/* Información adicional según el tipo */}
                        <div className="space-details">
                          <div className="detail-item">
                            <span className="detail-icon">🏢</span>
                            <span className="detail-text">
                              {space.nombre.includes('Aula') ? 'Edificio Académico' :
                               space.nombre.includes('Laboratorio') ? 'Edificio de Laboratorios' :
                               'Edificio Principal'}
                            </span>
                          </div>
                          
                          <div className="detail-item">
                            <span className="detail-icon">📍</span>
                            <span className="detail-text">
                              {space.nombre.split(' ')[1]?.charAt(0) || '2'}° Piso
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-footer">
                          <button 
                            className="view-details-btn"
                            onClick={() => handleSpaceClick(space)}
                          >
                            Ver detalles →
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Modal de detalles */}
      {showModal && selectedSpace && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-top">
                <div 
                  className="modal-space-icon"
                  style={{ color: getCategoryColor(selectedSpace.tipo) }}
                >
                  {getCategoryIcon(selectedSpace.tipo)}
                </div>
                <div className="modal-header-info">
                  <h2>{selectedSpace.nombre}</h2>
                  <div className="modal-subtitle">
                    <span className="modal-space-id">ID: {selectedSpace.id}</span>
                    <span className="modal-space-type">{selectedSpace.tipo}</span>
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
            </div>

            <div className="modal-body">
              {/* Información básica */}
              <div className="modal-section">
                <h3>📋 Descripción</h3>
                <p>{selectedSpace.descripcion}</p>
              </div>

              {/* Detalles principales */}
              <div className="details-grid">
                <div className="detail-card">
                  <h4>🏷️ Tipo</h4>
                  <div className="type-display">
                    <span 
                      className="type-badge"
                      style={{ 
                        backgroundColor: `${getCategoryColor(selectedSpace.tipo)}15`,
                        color: getCategoryColor(selectedSpace.tipo)
                      }}
                    >
                      {getCategoryIcon(selectedSpace.tipo)} {selectedSpace.tipo}
                    </span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h4>👥 Capacidad</h4>
                  <div className="capacity-display">
                    <span className="capacity-value">{selectedSpace.capacidad}</span>
                    <span className="capacity-unit">personas</span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h4>📊 Estado</h4>
                  <div className="availability-status">
                    <span className="availability-icon">
                      {getSpaceStatus(selectedSpace).icon}
                    </span>
                    <span style={{ color: getSpaceStatus(selectedSpace).color }}>
                      {getSpaceStatus(selectedSpace).text}
                    </span>
                  </div>
                </div>
                
                <div className="detail-card">
                  <h4>🏢 Ubicación</h4>
                  <div className="location-info">
                    <p>Edificio: {
                      selectedSpace.nombre.includes('Aula') ? 'Académico' :
                      selectedSpace.nombre.includes('Laboratorio') ? 'Laboratorios' :
                      'Principal'
                    }</p>
                    <p>Piso: {selectedSpace.nombre.split(' ')[1]?.charAt(0) || '2'}°</p>
                  </div>
                </div>
              </div>

              {/* Características según tipo */}
              <div className="modal-section">
                <h3>🌟 Equipamiento</h3>
                <div className="features-list-modal">
                  {/* Equipamiento común */}
                  <span className="feature-tag-modal">💡 Iluminación LED</span>
                  <span className="feature-tag-modal">🪑 Mobiliario ajustable</span>
                  <span className="feature-tag-modal">🖥️ Proyector multimedia</span>
                  <span className="feature-tag-modal">🔌 Conexiones eléctricas</span>
                  
                  {/* Equipamiento específico por tipo */}
                  {selectedSpace.tipo === 'Auditorio' && (
                    <>
                      <span className="feature-tag-modal">🎤 Sistema de sonido profesional</span>
                      <span className="feature-tag-modal">🎭 Escenario amplio</span>
                      <span className="feature-tag-modal">💺 Asientos acolchonados</span>
                      <span className="feature-tag-modal">📹 Sistema de videoconferencia</span>
                    </>
                  )}
                  
                  {selectedSpace.tipo.includes('Laboratorio de Computación') && (
                    <>
                      <span className="feature-tag-modal">💻 25 computadoras de última generación</span>
                      <span className="feature-tag-modal">🌐 Internet de alta velocidad</span>
                      <span className="feature-tag-modal">🔌 Estaciones de carga USB-C</span>
                      <span className="feature-tag-modal">🖨️ Impresora láser</span>
                    </>
                  )}
                  
                  {selectedSpace.tipo.includes('Laboratorio de Física') && (
                    <>
                      <span className="feature-tag-modal">🔭 Equipo especializado en física</span>
                      <span className="feature-tag-modal">⚡ Mesas antiestáticas</span>
                      <span className="feature-tag-modal">🧪 Instrumentos de medición precisos</span>
                      <span className="feature-tag-modal">🔬 Microscopios electrónicos</span>
                    </>
                  )}
                </div>
              </div>

              {/* Horarios sugeridos */}
              <div className="modal-section">
                <h3>🕐 Horarios de Uso</h3>
                <div className="schedule-suggestions">
                  <div className="schedule-item">
                    <span className="schedule-day">Lunes a Viernes</span>
                    <span className="schedule-time">7:00 AM - 9:00 PM</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-day">Sábados</span>
                    <span className="schedule-time">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-day">Domingos</span>
                    <span className="schedule-time">9:00 AM - 2:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Políticas de uso */}
              <div className="modal-section important-notes">
                <h3>📌 Políticas de Uso</h3>
                <ul className="notes-list">
                  <li>✅ Reserva mínima: 1 hora</li>
                  <li>✅ Reserva máxima: 4 horas por día</li>
                  <li>✅ Se requiere reserva previa por sistema</li>
                  <li>✅ Presentar identificación al ingresar</li>
                  <li>✅ Reportar cualquier daño al personal</li>
                  <li>✅ Dejar el espacio ordenado después de su uso</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cerrar
              </button>
              <button className="btn-primary">
                📅 Reservar este espacio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalResources;