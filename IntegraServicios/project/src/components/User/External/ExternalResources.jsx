import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import {
  getLabs,
  getCategoryIcon,
  getCategoryColor,
  getStatusBadge
} from '../../../api/integracion/waysoft-api-client';
import './ExternalResources.css';

const ExternalResources = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExternalLabs();
  }, []);

  const loadExternalLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando laboratorios...');
      const result = await getLabs({
        status: 'available',
        limit: 50
      });
      
      console.log('📊 Resultado de getLabs:', result);
      
      if (result.success) {
        setLabs(result.data || []);
        
        if (result.data && result.data.length === 0) {
          setError('No se encontraron laboratorios disponibles');
        }
      } else {
        setError(`Error al cargar laboratorios: ${result.error}`);
      }
      
    } catch (err) {
      console.error('❌ Error en loadExternalLabs:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/app/resources/browse');
  };

  const handleLabClick = (lab) => {
    console.log('🔍 Laboratorio clickeado:', lab);
    setSelectedLab(lab);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLab(null);
  };

  // Función para obtener el código del laboratorio
  const getLabCode = (lab) => {
    return lab.code || lab.waysoft_id || lab.id || 'N/A';
  };

  // Formatear disponibilidad
  const formatAvailability = (lab) => {
    if (!lab.current_availability) {
      return {
        text: 'Información no disponible',
        color: '#6B7280',
        icon: '❓'
      };
    }
    
    if (lab.current_availability.is_available) {
      return {
        text: '✅ Disponible ahora',
        color: '#10B981',
        icon: '✅'
      };
    } else if (lab.current_availability.next_available) {
      const next = lab.current_availability.next_available;
      return {
        text: `⏰ Próximo: ${next.day === 'hoy' ? 'Hoy' : next.day} ${next.start}-${next.end}`,
        color: '#F59E0B',
        icon: '⏰'
      };
    }
    return {
      text: '❌ No disponible',
      color: '#EF4444',
      icon: '❌'
    };
  };

  return (
    <div className="external-resources">
      <div className="external-header">
        <button onClick={handleBackClick} className="back-button">
          ← Volver a Unidades
        </button>
        <div className="header-content">
          <h1>🔗 Recursos Externos</h1>
          <p>Laboratorios disponibles a través de Waysoft API</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando laboratorios externos...</p>
        </div>
      ) : error ? (
        <Card className="error-card">
          <div className="error-content">
            <div className="error-icon">⚠️</div>
            <h3>Error</h3>
            <p className="error-message">{error}</p>
            <button 
              onClick={loadExternalLabs} 
              className="btn-retry"
            >
              Reintentar
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div className="labs-header">
            <h2>Laboratorios Disponibles ({labs.length})</h2>
            <p>Haz clic en un laboratorio para ver más detalles</p>
          </div>

          <div className="labs-grid">
            {labs.length > 0 ? (
              labs.map((lab) => {
                const statusBadge = getStatusBadge(lab.status);
                const categoryColor = getCategoryColor(lab.category);
                const categoryIcon = getCategoryIcon(lab.category);
                const labCode = getLabCode(lab);
                const availability = formatAvailability(lab);
                
                return (
                  <Card 
                    key={lab.id} 
                    className="lab-card"
                  >
                    <div className="lab-card-content">
                      <div className="lab-card-header">
                        <div 
                          className="lab-icon"
                          style={{ color: categoryColor }}
                        >
                          {categoryIcon}
                        </div>
                        <div className="lab-header-info">
                          <h3 className="lab-name">{lab.name}</h3>
                          <div className="lab-codes">
                            <span className="lab-code">{labCode}</span>
                            <span className="lab-type">{lab.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="lab-description">
                        {lab.description}
                      </p>
                      
                      <div className="lab-meta">
                        <span 
                          className="lab-category"
                          style={{ 
                            backgroundColor: `${categoryColor}15`,
                            color: categoryColor,
                            borderColor: `${categoryColor}30`
                          }}
                        >
                          {categoryIcon} {lab.category}
                        </span>
                        <span 
                          className="lab-availability"
                          style={{ 
                            backgroundColor: `${availability.color}15`,
                            color: availability.color,
                            borderColor: `${availability.color}30`
                          }}
                        >
                          {availability.icon} {availability.text}
                        </span>
                      </div>
                      
                      <div className="lab-details">
                        <div className="detail-item">
                          <span className="detail-icon">👥</span>
                          <span className="detail-text">{lab.capacity || 0} personas</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📍</span>
                          <span className="detail-text">{lab.location || 'N/A'}</span>
                        </div>
                        {lab.convention_info?.institution && (
                          <div className="detail-item">
                            <span className="detail-icon">🏛️</span>
                            <span className="detail-text">{lab.convention_info.institution}</span>
                          </div>
                        )}
                      </div>
                      
                      {lab.features && lab.features.length > 0 && (
                        <div className="lab-features">
                          <div className="features-label">Características:</div>
                          <div className="features-list">
                            {lab.features.slice(0, 3).map((feature, index) => (
                              <span key={index} className="feature-tag">
                                {feature.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {lab.features.length > 3 && (
                              <span className="more-features">
                                +{lab.features.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="lab-footer">
                        <button 
                          className="view-details-btn"
                          onClick={() => handleLabClick(lab)}
                        >
                          Ver detalles completos →
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="no-labs-card">
                <div className="no-labs-content">
                  <div className="no-labs-icon">🔍</div>
                  <h3>No se encontraron laboratorios</h3>
                  <p>No hay recursos externos disponibles en este momento</p>
                  <button onClick={loadExternalLabs} className="btn-retry">
                    Actualizar lista
                  </button>
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Modal de detalles SIMPLIFICADO */}
      {showModal && selectedLab && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-top">
                <div 
                  className="modal-lab-icon"
                  style={{ color: getCategoryColor(selectedLab.category) }}
                >
                  {getCategoryIcon(selectedLab.category)}
                </div>
                <div>
                  <h2>{selectedLab.name}</h2>
                  <div className="modal-subtitle">
                    <span className="modal-lab-code">{getLabCode(selectedLab)}</span>
                    <span className="modal-lab-type">{selectedLab.type}</span>
                    <span className="modal-lab-category">{selectedLab.category}</span>
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              
              {selectedLab.convention_info && (
                <div className="convention-badge">
                  <span className="convention-icon">🤝</span>
                  <span>Convenio con: {selectedLab.convention_info.institution}</span>
                </div>
              )}
            </div>

            <div className="modal-body">
              {/* Información básica */}
              <div className="modal-section">
                <h3>📋 Descripción</h3>
                <p>{selectedLab.description}</p>
              </div>

              {/* Detalles principales */}
              <div className="details-grid">
                <div className="detail-card">
                  <h4>📍 Ubicación</h4>
                  <p>{selectedLab.location}</p>
                </div>
                
                <div className="detail-card">
                  <h4>👥 Capacidad</h4>
                  <p>{selectedLab.capacity} personas</p>
                </div>
                
                <div className="detail-card">
                  <h4>📊 Estado</h4>
                  <div className="availability-status">
                    <span className="availability-icon">
                      {formatAvailability(selectedLab).icon}
                    </span>
                    <span style={{ color: formatAvailability(selectedLab).color }}>
                      {formatAvailability(selectedLab).text}
                    </span>
                  </div>
                </div>
                
                {selectedLab.metadata?.rating && (
                  <div className="detail-card">
                    <h4>⭐ Rating</h4>
                    <p>{selectedLab.metadata.rating}/5.0</p>
                  </div>
                )}
              </div>

              {/* Características */}
              {selectedLab.features && selectedLab.features.length > 0 && (
                <div className="modal-section">
                  <h3>🌟 Características</h3>
                  <div className="features-list-modal">
                    {selectedLab.features.map((feature, index) => (
                      <span key={index} className="feature-tag-modal">
                        {feature.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Información de convenio */}
              {selectedLab.convention_info && (
                <div className="modal-section convention-section">
                  <h3>🤝 Información del Convenio</h3>
                  <div className="convention-details">
                    <div className="convention-item">
                      <strong>Institución:</strong> {selectedLab.convention_info.institution}
                    </div>
                    <div className="convention-item">
                      <strong>Tipo de convenio:</strong> {selectedLab.convention_info.agreement_type}
                    </div>
                    <div className="convention-item">
                      <strong>Válido hasta:</strong> {selectedLab.convention_info.valid_until}
                    </div>
                    <div className="convention-item">
                      <strong>Contacto:</strong> {selectedLab.convention_info.contact_person}
                    </div>
                    <div className="convention-note">
                      💡 Este laboratorio está disponible sin costo por convenio académico
                    </div>
                  </div>
                </div>
              )}

              {/* Imágenes */}
              {selectedLab.images && selectedLab.images.length > 0 && (
                <div className="modal-section">
                  <h3>🖼️ Imágenes</h3>
                  <div className="images-grid">
                    {selectedLab.images.slice(0, 2).map((image, index) => (
                      <div key={index} className="image-container">
                        <img 
                          src={image} 
                          alt={`${selectedLab.name} - Imagen ${index + 1}`}
                          className="lab-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '🖼️ Imagen no disponible';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cerrar
              </button>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalResources;