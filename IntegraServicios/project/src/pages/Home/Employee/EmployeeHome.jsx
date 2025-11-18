import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import "./EmployeeHome.css";

const EmployeeHome = () => {
  const [stats, setStats] = useState({
    pendingLoans: 0,
    activeReservations: 0,
    unitResources: 0,
    todayReturns: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Por ahora datos de ejemplo - luego conectaremos con la API
    setStats({
      pendingLoans: 12,
      activeReservations: 8,
      unitResources: 25,
      todayReturns: 5,
    });
  };

  const statCards = [
    {
      title: "Préstamos Pendientes",
      value: stats.pendingLoans,
      icon: "📦",
      color: "#2563eb",
    },
    {
      title: "Reservas Activas",
      value: stats.activeReservations,
      icon: "✅",
      color: "#16a34a",
    },
    {
      title: "Recursos de la Unidad",
      value: stats.unitResources,
      icon: "🏢",
      color: "#ea580c",
    },
    {
      title: "Devoluciones Hoy",
      value: stats.todayReturns,
      icon: "🔄",
      color: "#7c3aed",
    },
  ];

  return (
    <div className="employee-home">
      <h1 className="page-title">Dashboard - Empleado de Unidad</h1>
      <p className="page-subtitle">
        Gestión de recursos y préstamos de su unidad
      </p>

      <div className="stats-grid">
        {statCards.map((stat) => (
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
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <a href="/employee/loans" className="action-card">
            <span className="action-icon">📦</span>
            <span>Gestionar Préstamos</span>
          </a>
          <a href="/employee/returns" className="action-card">
            <span className="action-icon">🔄</span>
            <span>Registrar Devoluciones</span>
          </a>
          <a href="/employee/reservations" className="action-card">
            <span className="action-icon">📅</span>
            <span>Ver Reservas</span>
          </a>
          <a href="/employee/resources" className="action-card">
            <span className="action-icon">🏢</span>
            <span>Recursos de la Unidad</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHome;
