import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Alert from '../components/common/Alert';
import './UserLayout.css';

const UserLayout = () => {
  const { user, logout } = useAuth();
  const { notification, closeNotification } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/app', label: 'Inicio', icon: '🏠' },
    { path: '/app/resources', label: 'Recursos', icon: '🔍' },
    { path: '/app/reservations', label: 'Mis Reservas', icon: '📅' },
  ];

  return (
    <div className="user-layout">
      <header className="user-header">
        <div className="user-header-content">
          <Link to="/app" className="logo">
            Sistema de Reservas
          </Link>

          <nav className="user-nav">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`user-nav-item ${location.pathname === item.path ? 'user-nav-item-active' : ''}`}
              >
                <span className="user-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="user-header-right">
            <div className="user-profile">
              <span className="user-profile-name">{user?.name}</span>
              <span className="user-profile-role">{user?.role}</span>
            </div>
            <button className="user-logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="user-content">
        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onClose={closeNotification}
          />
        )}
        <Outlet />
      </main>

      <footer className="user-footer">
        <p>&copy; 2025 Sistema de Reservas. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default UserLayout;
