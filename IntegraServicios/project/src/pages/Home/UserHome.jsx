import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../context/UIContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { getMyReservationsApi } from "../../api/Reservation/Reservation";
import "./UserHome.css";

const UserHome = () => {
  const { user } = useAuth();
  const { showError } = useUI();
  const navigate = useNavigate();
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0
  });

  useEffect(() => {
   
      loadMyReservations();
    
  }, [user?.id]);

  const loadMyReservations = async () => {
    
    try {
      setLoading(true);
      
      // Usar tu API real de reservaciones
      const response = await getMyReservationsApi({
        limit: 20,
        page: 1
      });
      
      let reservationsData = [];
      
      if (response && response.reservations) {
        reservationsData = response.reservations;
      } else if (Array.isArray(response)) {
        reservationsData = response;
      }
      
      // Calcular estadísticas
      const now = new Date();
      const total = reservationsData.length;
      
      const active = reservationsData.filter(res => {
        const status = res.status?.toLowerCase();
        return status === 'pendiente' || status === 'activa';
      }).length;
      
      const completed = reservationsData.filter(res => {
        const status = res.status?.toLowerCase();
        return status === 'finalizada';
      }).length;
      
      setStats({
        total,
        active,
        completed
      });
      
      // Filtrar próximas reservas (futuras y activas/pendientes)
      const upcoming = reservationsData
        .filter(res => {
          const startDateStr = res.startDateTime || res.date;
          if (!startDateStr) return false;
          
          try {
            const startDate = new Date(startDateStr);
            const isFuture = startDate > now;
            const status = res.status?.toLowerCase();
            const isValidStatus = status === 'pendiente' || status === 'activa';
            
            return isFuture && isValidStatus;
          } catch (error) {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a.startDateTime || a.date);
            const dateB = new Date(b.startDateTime || b.date);
            return dateA - dateB;
          } catch (error) {
            return 0;
          }
        })
        .slice(0, 3); // Mostrar máximo 3
        
      setUpcomingReservations(upcoming);
    } catch (error) {
      console.error("Error cargando reservas:", error);
      showError("Error al cargar tus reservas");
      setUpcomingReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatDisplayTime = (dateString) => {
    if (!dateString) return "Hora no disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Hora inválida";
    }
  };

  const getStatusText = (status) => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case "pendiente":
        return "Pendiente";
      case "activa":
        return "Activa";
      case "finalizada":
        return "Finalizada";
      case "cancelada":
        return "Cancelada";
      default:
        return status || "Desconocido";
    }
  };

  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch(statusLower) {
      case "pendiente":
        return "pendiente";
      case "activa":
        return "activa";
      case "finalizada":
        return "finalizada";
      case "cancelada":
        return "cancelada";
      default:
        return "unknown";
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'activa':
        return '#10b981'; // Verde
      case 'pendiente':
        return '#f59e0b'; // Naranja
      case 'finalizada':
        return '#3b82f6'; // Azul
      case 'cancelada':
        return '#ef4444'; // Rojo
      default:
        return '#9ca3af'; // Gris
    }
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="user-home">
      {/* Sección de bienvenida */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">¡Bienvenido, {user?.name}!</h1>
          <p className="welcome-text">
            Gestiona tus reservas y encuentra los recursos que necesitas
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-section">
        <Card className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total reservas</p>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Reservas activas</p>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completadas</p>
          </div>
        </Card>
      </div>

      {/* Acciones principales */}
      <div className="home-actions">
        <Card className="action-highlight">
          <div className="action-highlight-content">
            <div className="action-highlight-icon">🔍</div>
            <div className="action-highlight-info">
              <h3>Buscar Recursos</h3>
              <p>Encuentra y reserva aulas, laboratorios y equipos disponibles</p>
              <Button 
                onClick={() => navigate("/app/resources")}
                variant="primary"
                className="action-btn"
              >
                Explorar Recursos
              </Button>
            </div>
          </div>
        </Card>

        <Card className="action-highlight">
          <div className="action-highlight-content">
            <div className="action-highlight-icon">📅</div>
            <div className="action-highlight-info">
              <h3>Mis Reservas</h3>
              <p>Consulta, gestiona y cancela tus reservas activas</p>
              <Button
                onClick={() => navigate("/app/reservations")}
                variant="secondary"
                className="action-btn"
              >
                Ver Todas las Reservas
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Próximas reservas */}
      <Card className="upcoming-reservations">
        <div className="card-header">
          <h2>📅 Próximas Reservas</h2>
          <Button
            size="small"
            variant="outline"
            onClick={loadMyReservations}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
        
        {loading ? (
          <div className="loading-state">
            <Loader size="small" />
            <p>Cargando próximas reservas...</p>
          </div>
        ) : upcomingReservations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h4>No tienes reservas próximas</h4>
            <p>¡Empieza a reservar recursos ahora mismo!</p>
            <Button
              variant="primary"
              onClick={() => navigate("/app/resources")}
            >
              Buscar Recursos
            </Button>
          </div>
        ) : (
          <div className="reservations-list">
            {upcomingReservations.map((reservation) => {
              const status = reservation.status?.toLowerCase();
              const statusColor = getStatusColor(status);
              
              return (
                <div key={reservation.id} className="reservation-item">
                  <div className="reservation-info">
                    <h4 className="reservation-resource">
                      {reservation.resource?.name || reservation.resourceName || "Recurso"}
                    </h4>
                    <div className="reservation-details">
                      <span className="reservation-date">
                        📅 {formatDisplayDate(reservation.startDateTime || reservation.date)}
                      </span>
                      <span className="reservation-time">
                        ⏰ {formatDisplayTime(reservation.startDateTime || reservation.startTime)}
                      </span>
                    </div>
                    {reservation.purpose && (
                      <p className="reservation-purpose">
                        {reservation.purpose}
                      </p>
                    )}
                  </div>
                  <div 
                    className={`status-badge status-${getStatusClass(reservation.status)}`}
                    style={{ 
                      backgroundColor: `${statusColor}15`,
                      color: statusColor,
                      borderColor: statusColor
                    }}
                  >
                    {getStatusText(reservation.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserHome;