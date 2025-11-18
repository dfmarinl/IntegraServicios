import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import { getUnitsApi } from "../../../api/unit/units";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import CreateUnitForm from "../../../forms/CreateUnitForm/CreateUnitForm";
//import UnitConfigModal from "./UnitConfigModal";
import "./UnitsManagement.css";

const UnitsManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      setError(null);
      const unitsData = await getUnitsApi();
      setUnits(unitsData);
    } catch (err) {
      console.error("Error al cargar unidades:", err);
      setError("Error al cargar las unidades");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = (unit) => {
    setSelectedUnit(unit);
    setIsConfigModalOpen(true);
  };

  const handleCloseConfigModal = () => {
    setIsConfigModalOpen(false);
    setSelectedUnit(null);
  };

  const handleCreateSuccess = (newUnit) => {
    setIsCreateModalOpen(false);
    // Recargar la lista de unidades para incluir la nueva
    loadUnits();
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const managementCards = [
    {
      title: "Unidades Activas",
      value: units.length,
      icon: "🏛️",
      color: "#2563eb",
      description: "Total de unidades en el sistema",
    },
    {
      title: "Granularidad Promedio",
      value:
        units.length > 0
          ? `${Math.round(
              units.reduce((sum, unit) => sum + unit.granularity, 0) /
                units.length
            )} min`
          : "0 min",
      icon: "⏱️",
      color: "#16a34a",
      description: "Tiempo mínimo promedio de préstamo",
    },
    {
      title: "Unidades Recientes",
      value: units.filter((unit) => {
        const createdDate = new Date(unit.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length,
      icon: "🆕",
      color: "#ea580c",
      description: "Creadas en los últimos 7 días",
    },
  ];

  const actionCards = [
    {
      title: "Crear Nueva Unidad",
      description: "Registrar una nueva unidad de servicios",
      icon: "➕",
      onClick: () => setIsCreateModalOpen(true),
      color: "#10b981",
    },
  ];

  if (loading) {
    return <div className="loading">Cargando unidades...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadUnits} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="units-management">
      <h1 className="page-title">Gestión de Unidades</h1>
      <p className="page-subtitle">
        Administra las unidades de servicios, sus horarios y recursos
      </p>

      {/* Estadísticas */}
      <div className="stats-grid">
        {managementCards.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <div className="stat-content">
              <div
                className="stat-icon"
                style={{ backgroundColor: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="stat-details">
                <p className="stat-title">{stat.title}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-description">{stat.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Acción de Crear Nueva Unidad */}
      <div className="management-actions">
        <h2>Acciones de Gestión</h2>
        <div className="actions-grid">
          {actionCards.map((action) => (
            <button
              key={action.title}
              className="action-card"
              onClick={action.onClick}
            >
              <div
                className="action-icon"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <div className="action-details">
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de unidades con botón de Configurar */}
      <div className="units-overview">
        <h2>Unidades Existentes</h2>
        <div className="units-list">
          {units.map((unit) => (
            <Card key={unit.id} className="unit-card">
              <div className="unit-header">
                <h3>{unit.name}</h3>
                <span className="unit-id">ID: {unit.id}</span>
              </div>
              <div className="unit-description">
                <p>{unit.description}</p>
              </div>
              <div className="unit-stats">
                <div className="unit-stat">
                  <span className="stat-number">{unit.granularity}</span>
                  <span className="stat-label">minutos</span>
                </div>
                <div className="unit-stat">
                  <span className="stat-number">
                    {new Date(unit.createdAt).toLocaleDateString()}
                  </span>
                  <span className="stat-label">Fecha de creación</span>
                </div>
              </div>
              <div className="unit-actions">
                <button className="btn-outline">Editar</button>
                <button
                  className="btn-primary"
                  onClick={() => handleConfigure(unit)}
                >
                  Configurar
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de creación de unidad */}
      <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nueva Unidad"
        subtitle="Complete los datos para registrar una nueva unidad"
        size="medium"
      >
        <CreateUnitForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal>

      {/* Modal de configuración (pendiente) */}
      {/* {isConfigModalOpen && (
        <UnitConfigModal unit={selectedUnit} onClose={handleCloseConfigModal} />
      )} */}
    </div>
  );
};

export default UnitsManagement;
