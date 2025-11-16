import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { getReservations } from "../../api/reservations";
import "./UserHome.css";

const UserHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myReservations, setMyReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReservations();
  }, []);

  const loadMyReservations = async () => {
    const response = await getReservations({
      userId: user?.id,
      status: "confirmed",
    });
    if (response.success) {
      setMyReservations(response.data.slice(0, 3));
    }
    setLoading(false);
  };

  return (
    <div className="user-home">
      <div className="welcome-section">
        <h1 className="welcome-title">Bienvenido, {user?.name}</h1>
        <p className="welcome-text">
          Gestiona tus reservas y encuentra los recursos que necesitas
        </p>
      </div>

      <div className="home-actions">
        <Card className="action-highlight">
          <div className="action-highlight-content">
            <div className="action-highlight-icon">🔍</div>
            <div>
              <h3>Buscar Recursos</h3>
              <p>Encuentra y reserva aulas, laboratorios y equipos</p>
            </div>
            <Button onClick={() => navigate("/app/resources")}>
              Ver Recursos
            </Button>
          </div>
        </Card>

        <Card className="action-highlight">
          <div className="action-highlight-content">
            <div className="action-highlight-icon">📅</div>
            <div>
              <h3>Mis Reservas</h3>
              <p>Consulta y gestiona tus reservas activas</p>
            </div>
            <Button
              onClick={() => navigate("/app/reservations")}
              variant="secondary"
            >
              Ver Reservas
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Próximas Reservas" className="upcoming-reservations">
        {loading ? (
          <p className="loading-text">Cargando...</p>
        ) : myReservations.length === 0 ? (
          <p className="empty-text">No tienes reservas próximas</p>
        ) : (
          <div className="reservations-list">
            {myReservations.map((reservation) => (
              <div key={reservation.id} className="reservation-item">
                <div className="reservation-info">
                  <h4>{reservation.resourceName}</h4>
                  <p className="reservation-date">
                    {reservation.date} • {reservation.startTime} -{" "}
                    {reservation.endTime}
                  </p>
                </div>
                <span className={`status-badge status-${reservation.status}`}>
                  {reservation.status === "confirmed"
                    ? "Confirmada"
                    : reservation.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserHome;
