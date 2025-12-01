import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getActiveUnitsApi } from "../../../api/Unit/units";
import Card from "../../common/Card";
import "./UnitsView.css";

const UnitsView = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const unitsData = await getActiveUnitsApi();
      setUnits(unitsData);
    } catch (err) {
      console.error("Error al cargar unidades:", err);
      setError("Error al cargar las unidades disponibles");
    } finally {
      setLoading(false);
    }
  };

  const handleUnitClick = (unitId) => {
    console.log('🟢 CLICK DETECTADO - Navegando a unidad:', unitId);
    navigate(`/app/resources/browse/unit/${unitId}/types`);
  };

  // Para debug - verificar que las unidades se cargan
  useEffect(() => {
    if (units.length > 0) {
      console.log('🟢 Unidades cargadas:', units);
    }
  }, [units]);

  if (loading) {
    return (
      <div className="units-loading">
        <div className="loading-spinner"></div>
        <p>Cargando unidades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="units-error">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar unidades</h3>
        <p>{error}</p>
        <button onClick={loadUnits} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="units-view">
      <div className="units-header">
        <h1>Unidades Disponibles</h1>
        <p>Selecciona una unidad para ver sus tipos de recursos</p>
      </div>

      <div className="units-grid">
        {units.length > 0 ? (
          units.map((unit) => (
            <div 
              key={unit.id} 
              className="unit-card-wrapper"
              onClick={() => handleUnitClick(unit.id)}
            >
              <Card className="unit-card">
                <div className="unit-content">
                  <div className="unit-icon">
                    🏛️
                  </div>
                  <div className="unit-info">
                    <h3 className="unit-name">{unit.name}</h3>
                    <p className="unit-description">
                      {unit.description || "Sin descripción disponible"}
                    </p>
                    <div className="unit-meta">
                      <span className="unit-granularity">
                        Granularidad: {unit.granularity} min
                      </span>
                    </div>
                  </div>
                  <div className="unit-arrow">
                    →
                  </div>
                </div>
              </Card>
            </div>
          ))
        ) : (
          <div className="no-units">
            <div className="no-units-icon">🏛️</div>
            <h3>No hay unidades disponibles</h3>
            <p>No se encontraron unidades activas en el sistema</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitsView;