import { useState } from "react";
import { createLoanApi } from "../../api/loan/loans";
import Button from "../../components/common/Button";
import "./LoanForm.css";

const LoanForm = ({ reservation, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcular si está dentro de la ventana de entrega
  const calculateDeliveryStatus = () => {
    const now = new Date();
    const startTime = new Date(reservation.startDateTime);
    const timeDiff = (startTime - now) / (1000 * 60); // minutos

    const withinWindow = Math.abs(timeDiff) <= 5;
    const isLate = timeDiff < -5;

    return { withinWindow, isLate, timeDiff: Math.round(timeDiff) };
  };

  const deliveryStatus = calculateDeliveryStatus();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usar la hora actual del sistema
      const deliveryTime = new Date().toISOString();

      const loanData = {
        reservationId: reservation.id,
        deliveryTime: deliveryTime,
      };

      const response = await createLoanApi(loanData);

      if (response.success) {
        onSuccess(response.loan);
      } else {
        setError(response.message || "Error al registrar el préstamo");
      }
    } catch (err) {
      console.error("Error al registrar préstamo:", err);
      setError(err.message || "Error al registrar el préstamo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-form">
      {/* Información de la reserva */}
      <div className="reservation-info-section">
        <h3>Información de la Reserva</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Recurso:</span>
            <span className="info-value">{reservation.Resource?.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Tipo:</span>
            <span className="info-value">
              {reservation.Resource?.ResourceType?.name}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Usuario:</span>
            <span className="info-value">
              {reservation.User?.firstName} {reservation.User?.lastName}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Email:</span>
            <span className="info-value">{reservation.User?.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Hora programada:</span>
            <span className="info-value">
              {new Date(reservation.startDateTime).toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Propósito:</span>
            <span className="info-value">{reservation.purpose}</span>
          </div>
        </div>
      </div>

      {/* Estado de la ventana de entrega */}
      <div
        className={`delivery-status-alert ${
          deliveryStatus.withinWindow
            ? "status-success"
            : deliveryStatus.isLate
            ? "status-warning"
            : "status-error"
        }`}
      >
        <div className="status-icon">
          {deliveryStatus.withinWindow
            ? "✅"
            : deliveryStatus.isLate
            ? "⚠️"
            : "❌"}
        </div>
        <div className="status-content">
          <h4>
            {deliveryStatus.withinWindow
              ? "Dentro de la ventana de entrega"
              : deliveryStatus.isLate
              ? "Entrega retrasada"
              : "Fuera de la ventana de entrega"}
          </h4>
          <p>
            {deliveryStatus.withinWindow
              ? "La entrega se realizará en el lapso adecuado (±5 minutos)."
              : deliveryStatus.isLate
              ? `La reserva inició hace ${Math.abs(
                  deliveryStatus.timeDiff
                )} minutos. Se marcará como fallo de servicio.`
              : `Faltan ${deliveryStatus.timeDiff} minutos para la ventana de entrega. No se puede registrar aún.`}
          </p>
        </div>
      </div>

      {/* Información de hora de entrega */}
      <div className="delivery-time-section">
        <h3>Hora de Entrega</h3>
        <div className="current-time-display">
          <div className="time-icon">🕐</div>
          <div className="time-content">
            <p className="time-label">Hora actual del sistema:</p>
            <p className="time-value">
              {new Date().toLocaleString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
            <small className="time-note">
              Esta hora se registrará automáticamente al confirmar la entrega
            </small>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-alert">
          <span className="error-icon">❌</span>
          <p>{error}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="loan-form-container">
        <div className="form-note">
          <p>
            <strong>Importante:</strong> Al confirmar, se registrará que el
            recurso <strong>{reservation.Resource?.name}</strong> fue entregado
            a <strong>{reservation.User?.firstName}</strong> en este momento.
          </p>
          {!deliveryStatus.withinWindow && (
            <p className="warning-note">
              ⚠️ La entrega está fuera del lapso adecuado y se marcará
              automáticamente como <strong>fallo de servicio</strong>.
            </p>
          )}
        </div>

        <div className="form-buttons">
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {loading ? "Registrando..." : "Confirmar Entrega del Recurso"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
