import { useEffect, useState } from "react";
import Card from "../../../components/common/Card";
import { getReservations } from "../../../api/reservations";
import { getResources } from "../../../api/resources";
import { getUsers } from "../../../api/users";
import "./AdminHome.css";

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalReservations: 0,
    activeReservations: 0,
    totalResources: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [reservationsRes, resourcesRes, usersRes] = await Promise.all([
      getReservations(),
      getResources(),
      getUsers(),
    ]);

    const activeReservations =
      reservationsRes.data?.filter((r) => r.status === "confirmed").length || 0;

    setStats({
      totalReservations: reservationsRes.data?.length || 0,
      activeReservations,
      totalResources: resourcesRes.data?.length || 0,
      totalUsers: usersRes.data?.length || 0,
    });
  };

  const statCards = [
    {
      title: "Total Reservas",
      value: stats.totalReservations,
      icon: "📅",
      color: "#2563eb",
    },
    {
      title: "Reservas Activas",
      value: stats.activeReservations,
      icon: "✅",
      color: "#16a34a",
    },
    {
      title: "Recursos",
      value: stats.totalResources,
      icon: "🏢",
      color: "#ea580c",
    },
    {
      title: "Usuarios",
      value: stats.totalUsers,
      icon: "👥",
      color: "#7c3aed",
    },
  ];

  return (
    <div className="admin-home">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Bienvenido al sistema de gestión de reservas
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
          <a href="/admin/resources" className="action-card">
            <span className="action-icon">🏢</span>
            <span>Gestionar Recursos</span>
          </a>
          <a href="/admin/reservations" className="action-card">
            <span className="action-icon">📅</span>
            <span>Ver Reservas</span>
          </a>
          <a href="/admin/reports" className="action-card">
            <span className="action-icon">📈</span>
            <span>Generar Reportes</span>
          </a>
          <a href="/admin/users" className="action-card">
            <span className="action-icon">👥</span>
            <span>Gestionar Usuarios</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
