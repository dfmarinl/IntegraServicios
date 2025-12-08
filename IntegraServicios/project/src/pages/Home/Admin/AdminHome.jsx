import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import "./AdminHome.css";

const AdminHome = () => {
  const [loading, setLoading] = useState(false);

  // Exactamente las mismas opciones que en AdminLayout
  const quickActions = [
    {
      title: "Tipos de Recurso",
      description: "Administrar tipos de recursos disponibles",
      icon: "📋",
      href: "/admin/resource-types",
      color: "#10b981",
    },
    {
      title: "Recursos",
      description: "Gestionar recursos y su disponibilidad",
      icon: "🏢",
      href: "/admin/resources",
      color: "#f59e0b",
    },
    {
      title: "Reservas",
      description: "Consultar y administrar todas las reservas",
      icon: "📅",
      href: "/admin/reservations",
      color: "#8b5cf6",
    },
    {
      title: "Préstamos",
      description: "Gestionar préstamos de recursos",
      icon: "📦",
      href: "/admin/loans",
      color: "#ec4899",
    },
    {
      title: "Usuarios",
      description: "Administrar usuarios y permisos",
      icon: "👥",
      href: "/admin/users",
      color: "#14b8a6",
    },
    {
      title: "Unidades",
      description: "Gestionar unidades académicas",
      icon: "🏛️",
      href: "/admin/units",
      color: "#f97316",
    },
    {
      title: "Reportes",
      description: "Ver estadísticas y generar reportes",
      icon: "📈",
      href: "/admin/stats",
      color: "#6366f1",
    },
  ];

  // Estadísticas rápidas (si quieres agregar algo útil)
  const quickStats = [
    {
      label: "Reservas Hoy",
      value: "0",
      icon: "📅",
      color: "#3b82f6",
      href: "/admin/reservations?filter=today",
    },
    {
      label: "Recursos Activos",
      value: "0",
      icon: "✅",
      color: "#10b981",
      href: "/admin/resources?status=active",
    },
    {
      label: "Usuarios Activos",
      value: "0",
      icon: "👥",
      color: "#8b5cf6",
      href: "/admin/users?status=active",
    },
    {
      label: "Préstamos Pendientes",
      value: "0",
      icon: "⏳",
      color: "#f59e0b",
      href: "/admin/loans?status=pending",
    },
  ];

  const adminTips = [
    "💡 Verifica las reservas pendientes diariamente",
    "📋 Mantén actualizados los tipos de recursos",
    "✅ Asegúrate que los recursos estén disponibles",
    "👥 Revisa regularmente los usuarios registrados",
    "📊 Genera reportes mensuales para análisis",
    "⚙️ Configura correctamente las unidades académicas",
    "📦 Controla los préstamos de recursos físicos",
    "⭐ Revisa las calificaciones de los usuarios",
  ];

  return (
    <div className="admin-home">
      {/* Header con bienvenida */}
      <div className="welcome-section">
        <h1 className="page-title">Dashboard de Administración</h1>
        <p className="page-subtitle">
          Bienvenido al panel de control del sistema de gestión de reservas
        </p>

        <div className="welcome-message">
          <div className="welcome-icon">👋</div>
          <div>
            <p className="welcome-text">
              Desde aquí puedes gestionar todas las funcionalidades del sistema
              de manera rápida y eficiente.
            </p>
            <p className="last-login">
              Último acceso: Hoy,{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas - Coincide con AdminLayout */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2 className="section-title">Acciones Rápidas</h2>
          <p className="section-subtitle">
            Accede rápidamente a todas las secciones del sistema
          </p>
        </div>

        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="action-card"
              style={{
                "--action-color": action.color,
                "--action-color-light": `${action.color}20`,
              }}
            >
              <div
                className="action-icon-container"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <span className="action-icon" style={{ color: action.color }}>
                  {action.icon}
                </span>
              </div>

              <div className="action-content">
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
              </div>

              <div className="action-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 6L15 12L9 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Consejos para administradores */}
    </div>
  );
};

export default AdminHome;
