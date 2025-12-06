import React, { useState, useEffect } from "react";
import { createLoanApi } from "../../api/loan/loans";
import "./LoanForm.css";

const LoanForm = ({ reservation, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    reservationId: reservation?.id || "",
    deliveryTime: "",
    comments: "",
    resourceCondition: "excelente",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeInfo, setTimeInfo] = useState(null);

  useEffect(() => {
    if (reservation) {
      const now = new Date();
      const reservationStart = new Date(reservation.startDateTime);
      const timeDiff = (reservationStart - now) / (1000 * 60);
      const hasFailure = Math.abs(timeDiff) > 5;

      setTimeInfo({
        reservationStart,
        currentTime: now,
        timeDiff,
        hasFailure,
      });

      const nowISO = now.toISOString().slice(0, 16);
      setFormData((prev) => ({
        ...prev,
        deliveryTime: nowISO,
        reservationId: reservation.id,
      }));
    }
  }, [reservation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.deliveryTime) {
        throw new Error("Debe especificar la hora de entrega");
      }

      const loanData = {
        reservationId: formData.reservationId,
        deliveryTime: new Date(formData.deliveryTime).toISOString(),
      };

      const response = await createLoanApi(loanData);

      if (response.success) {
        const message = response.message;
        const details = response.serviceInfo;

        alert(
          `✅ ${message}\n\n📊 Detalles:\n• Hora programada: ${new Date(
            details.reservationStart
          ).toLocaleString()}\n• Hora de entrega: ${new Date(
            details.actualDelivery
          ).toLocaleString()}\n• Diferencia: ${
            details.timeDifference
          }\n• Estado: ${
            details.withinWindow
              ? "✅ Dentro de ventana"
              : "⚠️ Fuera de ventana"
          }`
        );

        if (onSuccess) {
          onSuccess(response.loan);
        }
      }
    } catch (err) {
      console.error("Error al crear préstamo:", err);
      setError(err.message || "Error al registrar la entrega");
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) {
    return (
      <div className="error-message">
        <p>No se encontró información de la reserva</p>
      </div>
    );
  }

  return (
    <div className="loan-form">
      <div className="form-header">
        <h3>Registrar Entrega de Recurso</h3>
        <p className="subtitle">
          Reserva #{reservation.id} - {reservation.Resource?.name}
        </p>
      </div>

      <div className="reservation-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Recurso:</span>
            <span className="info-value">
              <strong>{reservation.Resource?.name}</strong>
              <small>{reservation.Resource?.ResourceType?.name}</small>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Usuario:</span>
            <span className="info-value">
              {reservation.User?.firstName} {reservation.User?.lastName}
              <small>{reservation.User?.email}</small>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Hora programada:</span>
            <span className="info-value">
              {new Date(reservation.startDateTime).toLocaleString()}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Propósito:</span>
            <span className="info-value">{reservation.purpose}</span>
          </div>
        </div>
      </div>

      {timeInfo && (
        <div
          className={`time-info ${timeInfo.hasFailure ? "warning" : "success"}`}
        >
          <div className="time-info-content">
            <div className="time-icon">{timeInfo.hasFailure ? "⚠️" : "✅"}</div>
            <div className="time-details">
              <h4>
                {timeInfo.hasFailure
                  ? "Fuera de ventana de entrega"
                  : "Dentro de ventana de entrega"}
              </h4>
              <p>
                Diferencia: {Math.abs(Math.round(timeInfo.timeDiff))} minutos
                {timeInfo.timeDiff > 0 ? " antes" : " después"} del horario
                programado
              </p>
              <small>Ventana permitida: ±5 minutos del horario de inicio</small>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="deliveryTime">
            Hora de entrega *
            <small>
              La hora exacta en que se entrega el recurso al usuario
            </small>
          </label>
          <input
            type="datetime-local"
            id="deliveryTime"
            name="deliveryTime"
            value={formData.deliveryTime}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="resourceCondition">
            Estado del recurso
            <small>
              Condición en que se encuentra el recurso al momento de la entrega
            </small>
          </label>
          <select
            id="resourceCondition"
            name="resourceCondition"
            value={formData.resourceCondition}
            onChange={handleChange}
            className="form-control"
          >
            <option value="excelente">
              Excelente - Sin daños, funciona perfectamente
            </option>
            <option value="bueno">
              Bueno - Pequeños signos de uso, funciona bien
            </option>
            <option value="regular">
              Regular - Marcas de uso visible, funciona adecuadamente
            </option>
            <option value="defectuoso">
              Defectuoso - Problemas funcionales que requieren reparación
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="comments">
            Observaciones
            <small>Notas adicionales sobre la entrega</small>
          </label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows="3"
            className="form-control"
            placeholder="Ej: Usuario recibió capacitación básica, recurso con batería al 80%, etc."
          />
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Registrando...
              </>
            ) : (
              "✅ Registrar Entrega"
            )}
          </button>
        </div>

        <div className="form-note">
          <p>
            <strong>Nota:</strong> El sistema calculará automáticamente si hubo
            fallo de servicio basándose en la diferencia entre la hora
            programada y la hora de entrega. Falla de servicio = diferencia
            mayor a ±5 minutos.
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
