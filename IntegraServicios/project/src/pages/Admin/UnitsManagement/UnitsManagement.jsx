import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import "./UnitsManagement.css";

const UnitsManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    // Simular carga de unidades - luego conectarás con la API
    setTimeout(() => {
      setUnits([
        {
          id: 1,
          name: "Biblioteca Central",
          resourcesCount: 15,
          schedulesCount: 7,
        },
        { id: 2, name: "Laboratorios", resourcesCount: 8, schedulesCount: 5 },
        {
          id: 3,
          name: "Área Deportiva",
          resourcesCount: 12,
          schedulesCount: 6,
        },
      ]);
      setLoading(false);
    }, 1000);
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
      title: "Recursos Totales",
      value: units.reduce((sum, unit) => sum + unit.resourcesCount, 0),
      icon: "🏢",
      color: "#16a34a",
      description: "Suma de todos los recursos",
    },
    {
      title: "Horarios Configurados",
      value: units.reduce((sum, unit) => sum + unit.schedulesCount, 0),
      icon: "⏰",
      color: "#ea580c",
      description: "Total de horarios definidos",
    },
  ];

  const actionCards = [
    {
      title: "Crear Nueva Unidad",
      description: "Registrar una nueva unidad de servicios",
      icon: "➕",
      path: "/admin/units/create",
      color: "#10b981",
    },
    {
      title: "Gestionar Unidades",
      description: "Ver, editar y eliminar unidades existentes",
      icon: "📋",
      path: "/admin/units/list",
      color: "#3b82f6",
    },
    {
      title: "Configurar Horarios",
      description: "Definir horarios globales por unidad",
      icon: "⏰",
      path: "/admin/units/schedules",
      color: "#f59e0b",
    },
    {
      title: "Tipos de Recurso",
      description: "Gestionar tipos de recurso por unidad",
      icon: "📦",
      path: "/admin/units/resource-types",
      color: "#8b5cf6",
    },
    {
      title: "Recursos por Unidad",
      description: "Administrar recursos específicos",
      icon: "🏢",
      path: "/admin/units/resources",
      color: "#ef4444",
    },
    {
      title: "Empleados por Unidad",
      description: "Asignar empleados a unidades",
      icon: "👥",
      path: "/admin/units/employees",
      color: "#06b6d4",
    },
  ];

  if (loading) {
    return <div className="loading">Cargando unidades...</div>;
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

      {/* Acciones de Gestión */}
      <div className="management-actions">
        <h2>Gestión de Unidades</h2>
        <div className="actions-grid">
          {actionCards.map((action) => (
            <a key={action.title} href={action.path} className="action-card">
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
            </a>
          ))}
        </div>
      </div>

      {/* Lista rápida de unidades */}
      <div className="units-overview">
        <h2>Unidades Existentes</h2>
        <div className="units-list">
          {units.map((unit) => (
            <Card key={unit.id} className="unit-card">
              <div className="unit-header">
                <h3>{unit.name}</h3>
                <span className="unit-id">ID: {unit.id}</span>
              </div>
              <div className="unit-stats">
                <div className="unit-stat">
                  <span className="stat-number">{unit.resourcesCount}</span>
                  <span className="stat-label">Recursos</span>
                </div>
                <div className="unit-stat">
                  <span className="stat-number">{unit.schedulesCount}</span>
                  <span className="stat-label">Horarios</span>
                </div>
              </div>
              <div className="unit-actions">
                <button className="btn-outline">Editar</button>
                <button className="btn-outline">Configurar</button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnitsManagement;
