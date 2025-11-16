import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUI } from "../../context/UIContext";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import Loader from "../../components/common/Loader";
import {
  getReservations,
  cancelReservation,
  rateReservation,
} from "../../api/reservations";
import "./MyReservations.css";

const MyReservations = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useUI();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({
    open: false,
    reservation: null,
  });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    const response = await getReservations({ userId: user?.id });
    if (response.success) {
      setReservations(response.data);
    }
    setLoading(false);
  };

  const handleCancel = async (id) => {
    if (!confirm("¿Estás seguro de cancelar esta reserva?")) return;

    const response = await cancelReservation(id);
    if (response.success) {
      showSuccess(response.message);
      loadReservations();
    } else {
      showError(response.message);
    }
  };

  const handleOpenRating = (reservation) => {
    setRatingModal({ open: true, reservation });
    setRating(5);
    setComment("");
  };

  const handleSubmitRating = async () => {
    const response = await rateReservation(
      ratingModal.reservation.id,
      rating,
      comment
    );
    if (response.success) {
      showSuccess(response.message);
      setRatingModal({ open: false, reservation: null });
      loadReservations();
    } else {
      showError(response.message);
    }
  };

  const columns = [
    { key: "resourceName", label: "Recurso" },
    { key: "date", label: "Fecha" },
    {
      key: "time",
      label: "Horario",
      render: (row) => `${row.startTime} - ${row.endTime}`,
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <span className={`status-badge status-${row.status}`}>
          {row.status === "confirmed"
            ? "Confirmada"
            : row.status === "cancelled"
            ? "Cancelada"
            : row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="table-actions">
          {row.status === "confirmed" && (
            <Button
              size="small"
              variant="danger"
              onClick={() => handleCancel(row.id)}
            >
              Cancelar
            </Button>
          )}
          {row.status === "completed" && !row.rating && (
            <Button
              size="small"
              variant="success"
              onClick={() => handleOpenRating(row)}
            >
              Calificar
            </Button>
          )}
          {row.rating && (
            <span className="rating-display">⭐ {row.rating}/5</span>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <div className="my-reservations-page">
      <h1 className="page-title">Mis Reservas</h1>

      <Card>
        <Table
          columns={columns}
          data={reservations}
          emptyMessage="No tienes reservas registradas"
        />
      </Card>

      <Modal
        isOpen={ratingModal.open}
        onClose={() => setRatingModal({ open: false, reservation: null })}
        title="Calificar Servicio"
        size="small"
      >
        <div className="rating-form">
          <div className="rating-stars">
            <label>Calificación:</label>
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${rating >= star ? "star-active" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          <div className="rating-comment">
            <label>Comentario (opcional):</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comparte tu experiencia..."
              rows={4}
            />
          </div>

          <Button onClick={handleSubmitRating} fullWidth>
            Enviar Calificación
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyReservations;
