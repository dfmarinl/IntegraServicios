import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getActiveResourceTypesByUnitApi, getResourceTypeApi } from "../../../api/Resource/resourceType";
import { getUnitApi } from "../../../api/Unit/units";
import Card from "../../common/Card";
import "./ResourceTypesView.css";

const ResourceTypesView = () => {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [resourceTypes, setResourceTypes] = useState([]);
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (unitId) {
      loadData();
    }
  }, [unitId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar información de la unidad
      const unitData = await getUnitApi(unitId);
      setUnit(unitData);

      // Cargar tipos de recurso activos de la unidad específica
      const typesData = await getActiveResourceTypesByUnitApi(unitId);
      setResourceTypes(typesData);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("Error al cargar los tipos de recurso");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeClick = (typeId) => {
    console.log('🟢 CLICK en tipo de recurso:', typeId);
    navigate(`/app/resources/browse/unit/${unitId}/type/${typeId}/resources`);
  };

  const handleBackClick = () => {
    navigate("/app/resources");
  };

  if (loading) {
    return (
      <div className="types-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tipos de recurso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="types-error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar tipos de recurso</h3>
        <p>{error}</p>
        <button onClick={loadData} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="resource-types-view">
      <div className="types-header">
        <button onClick={handleBackClick} className="back-button">
          ← Volver a Unidades
        </button>
        <h1>Tipos de Recurso - {unit?.name}</h1>
        <p>Selecciona un tipo de recurso para ver los recursos disponibles</p>
      </div>

      <div className="types-grid">
        {resourceTypes.length > 0 ? (
          resourceTypes.map((type) => (
            <div 
              key={type.id} 
              className="type-card-wrapper"
              onClick={() => handleTypeClick(type.id)}
            >
              <Card className="type-card">
                <div className="type-content">
                  <div className="type-icon">
                    📋
                  </div>
                  <div className="type-info">
                    <h3 className="type-name">{type.name}</h3>
                    <p className="type-description">
                      {type.description || "Sin descripción disponible"}
                    </p>
                    <div className="type-meta">
                      <span className="type-granularity">
                        Tiempo mínimo: {type.granularity} min
                      </span>
                    </div>
                  </div>
                  <div className="type-arrow">
                    →
                  </div>
                </div>
              </Card>
            </div>
          ))
        ) : (
          <div className="no-types">
            <div className="no-types-icon">📋</div>
            <h3>No hay tipos de recurso disponibles</h3>
            <p>Esta unidad no tiene tipos de recurso activos</p>
            <button onClick={handleBackClick} className="btn-back">
              Volver a unidades
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceTypesView;