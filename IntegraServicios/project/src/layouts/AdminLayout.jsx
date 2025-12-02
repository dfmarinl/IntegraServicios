import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUI } from "../context/UIContext";
import Alert from "../components/common/Alert";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { notification, closeNotification, sidebarOpen, toggleSidebar } =
    useUI();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: "📊" },
    { path: "/admin/resource-types", label: "Tipos de Recurso", icon: "📋" },
    { path: "/admin/resources", label: "Recursos", icon: "🏢" },
    
    { path: "/admin/reservations", label: "Reservas", icon: "📅" },
    { path: "/admin/loans", label: "Préstamos", icon: "📦" },
    { path: "/admin/users", label: "Usuarios", icon: "👥" },
    { path: "/admin/employees", label: "Empleados", icon: "👷" },
    { path: "/admin/units", label: "Unidades", icon: "🏛️" },
    { path: "/admin/reports", label: "Reportes", icon: "📈" },
  ];

  return (
    <div className="admin-layout">
      <aside
        className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        <div className="sidebar-header">
          <h2 className="sidebar-title">Sistema de Reservas</h2>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "nav-item-active" : ""
              }`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="main-container">
        <header className="header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            ☰
          </button>

          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        <main className="content">
          {notification && (
            <Alert
              type={notification.type}
              message={notification.message}
              onClose={closeNotification}
            />
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
