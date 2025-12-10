import { useEffect, useState } from "react";
import { getMeApi } from "../../../api/user/auth"; // Ajusta la ruta según tu estructura
import "./EmployeeHome.css";

const EmployeeHome = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const data = await getMeApi(token);
        setUserData(data);
      } catch (err) {
        console.error("Error al obtener datos del usuario:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const quickActions = [
    {
      title: "Tipos de Recurso",
      description: "Administrar tipos de recursos disponibles",
      icon: "📋",
      href: "/employee/resource-types",
      color: "#10b981",
    },
    {
      title: "Recursos",
      description: "Gestionar recursos y su disponibilidad",
      icon: "🏢",
      href: "/employee/employee-resources",
      color: "#f59e0b",
    },
    {
      title: "Reservas",
      description: "Consultar y administrar todas las reservas",
      icon: "📅",
      href: "/employee/employee-reservations",
      color: "#8b5cf6",
    },
    {
      title: "Préstamos",
      description: "Gestionar préstamos de recursos",
      icon: "📦",
      href: "/employee/employee-loans",
      color: "#ec4899",
    },
    {
      title: "Horario de Unidad",
      description: "Gestionar el horario de la unidad",
      icon: "🏛️",
      href: "/employee/schedules",
      color: "#6366f1",
    },
  ];

  const employeeTips = [
    "💡 Verifica las reservas pendientes diariamente",
    "📋 Mantén actualizados los tipos de recursos",
    "✅ Asegúrate que los recursos estén disponibles",
    "👥 Revisa regularmente los usuarios registrados",
    "📊 Genera reportes mensuales para análisis",
    "📦 Controla los préstamos de recursos físicos",
    "⭐ Revisa las calificaciones de los recursos",
  ];

  if (loading) {
    return (
      <div className="employee-home">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-home">
        <div className="error-container">
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-home">
      {/* Header con bienvenida */}
      <div className="welcome-section">
        <h1 className="page-title">
          {userData?.unit ? (
            <>
              Dashboard -{" "}
              <span className="unit-name-title">{userData.unit.name}</span>
            </>
          ) : (
            "Dashboard - Sin Unidad Asignada"
          )}
        </h1>
        <p className="page-subtitle">
          {userData?.unit
            ? `Panel de gestión de ${userData.unit.name}`
            : "Contacta al administrador para asignarte una unidad"}
        </p>
      </div>

      {/* Acciones Rápidas */}
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
    </div>
  );
};

export default EmployeeHome;
