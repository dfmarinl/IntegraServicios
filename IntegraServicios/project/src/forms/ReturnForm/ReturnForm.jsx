import React, { useState, useEffect } from "react";
import { createReturnApi } from "../../api/loan/returns";
import "./ReturnForm.css";

const ReturnForm = ({ loan, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    loanId: loan?.id || "",
    returnTime: "",
    hasDamage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeInfo, setTimeInfo] = useState(null);

  useEffect(() => {
    if (loan) {
      const now = new Date();
      const reservationEnd = new Date(loan.Reservation?.endDateTime);
      const timeDiff = (now - reservationEnd) / (1000 * 60); // minutos

      // Solo es fallo si se devuelve MÁS DE 5 minutos DESPUÉS del fin
      const hasFailure = timeDiff > 5;
      const isEarly = now < reservationEnd;
      const isOnTime = timeDiff >= 0 && timeDiff <= 5;

      setTimeInfo({
        reservationEnd,
        currentTime: now,
        timeDiff,
        hasFailure,
        isEarly,
        isOnTime,
      });

      const nowISO = now.toISOString().slice(0, 16);
      setFormData((prev) => ({
        ...prev,
        loanId: loan.id,
        returnTime: nowISO,
      }));
    }
  }, [loan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.returnTime) {
        throw new Error("Debe especificar la hora de devolución");
      }

      // Validar que el préstamo no tenga ya una devolución
      if (loan.Return) {
        throw new Error("Este préstamo ya tiene una devolución registrada");
      }

      const returnData = {
        loanId: formData.loanId,
        returnTime: new Date(formData.returnTime).toISOString(),
        hasDamage: Boolean(formData.hasDamage), // Asegurar que sea boolean
      };

      console.log("📤 Datos enviados:", returnData); // Para debugging

      const response = await createReturnApi(returnData);

      if (response.success) {
        const message = response.message;
        const details = response.timeInfo;

        let statusEmoji = "✅";
        let statusText = "A tiempo";

        if (details.isEarly) {
          statusEmoji = "✅";
          statusText = "Devolución anticipada";
        } else if (details.hasFailure) {
          statusEmoji = "⚠️";
          statusText = "Devolución tardía";
        }

        alert(
          `${statusEmoji} ${message}\n\n📊 Detalles:\n• Hora programada de fin: ${new Date(
            details.reservationEnd
          ).toLocaleString()}\n• Hora de devolución: ${new Date(
            details.actualReturn
          ).toLocaleString()}\n• Diferencia: ${
            details.timeDifference
          }\n• Estado: ${statusText}`
        );

        if (onSuccess) {
          onSuccess(response.returnRecord);
        }
      }
    } catch (err) {
      console.error("Error al registrar devolución:", err);
      setError(err.message || "Error al registrar la devolución");
    } finally {
      setLoading(false);
    }
  };

  if (!loan) {
    return (
      <div className="error-message">
        <p>❌ No se encontró información del préstamo</p>
      </div>
    );
  }

  // Verificar si el préstamo ya tiene devolución
  if (loan.Return) {
    return (
      <div className="error-message">
        <p>⚠️ Este préstamo ya tiene una devolución registrada</p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
          Devolución registrada el:{" "}
          {new Date(loan.Return.returnTime).toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <div className="return-form">
      <div className="form-header">
        <h3>Registrar Devolución de Recurso</h3>
        <p className="subtitle">
          Préstamo #{loan.id} - {loan.Reservation?.Resource?.name}
        </p>
      </div>

      <div className="loan-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Recurso:</span>
            <span className="info-value">
              <strong>{loan.Reservation?.Resource?.name}</strong>
              <small>{loan.Reservation?.Resource?.ResourceType?.name}</small>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Usuario:</span>
            <span className="info-value">
              {loan.Reservation?.User?.firstName}{" "}
              {loan.Reservation?.User?.lastName}
              <small>{loan.Reservation?.User?.email}</small>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Horario de la reserva:</span>
            <span className="info-value">
              {new Date(loan.Reservation?.startDateTime).toLocaleString()}
              <small>
                hasta{" "}
                {new Date(loan.Reservation?.endDateTime).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </small>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Entrega realizada:</span>
            <span className="info-value">
              {new Date(loan.deliveryTime).toLocaleString()}
              <small>
                por {loan.Employee?.firstName} {loan.Employee?.lastName}
              </small>
            </span>
          </div>
        </div>
      </div>

      {timeInfo && (
        <div
          className={`time-info ${timeInfo.hasFailure ? "warning" : "success"}`}
        >
          <div className="time-info-content">
            <div className="time-icon">
              {timeInfo.isEarly ? "🕐" : timeInfo.isOnTime ? "✅" : "⚠️"}
            </div>
            <div className="time-details">
              <h4>
                {timeInfo.isEarly
                  ? "Devolución anticipada"
                  : timeInfo.isOnTime
                  ? "Ventana de devolución a tiempo"
                  : "Fuera de ventana de devolución"}
              </h4>
              <p>
                {timeInfo.isEarly ? (
                  <>
                    Devolviendo {Math.abs(Math.round(timeInfo.timeDiff))}{" "}
                    minutos <strong>antes</strong> del horario programado de fin
                  </>
                ) : (
                  <>
                    Diferencia: {Math.abs(Math.round(timeInfo.timeDiff))}{" "}
                    minutos
                    {timeInfo.timeDiff > 0 ? " después" : " antes"} del horario
                    programado de fin
                  </>
                )}
              </p>
              <small>
                {timeInfo.isEarly
                  ? "✅ Las devoluciones anticipadas no generan fallo de servicio"
                  : timeInfo.isOnTime
                  ? "✅ Dentro de la ventana permitida (±5 minutos)"
                  : "⚠️ Ventana permitida: ±5 minutos del horario de fin"}
              </small>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="returnTime">
            Hora de devolución *
            <small>La hora exacta en que el usuario devuelve el recurso</small>
          </label>
          <input
            type="datetime-local"
            id="returnTime"
            name="returnTime"
            value={formData.returnTime}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="hasDamage">
            ¿El recurso presenta daños? *
            <small>Indique si el recurso tiene algún daño o desperfecto</small>
          </label>
          <select
            id="hasDamage"
            name="hasDamage"
            value={formData.hasDamage.toString()}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                hasDamage: e.target.value === "true",
              }))
            }
            required
            className="form-control"
          >
            <option value="false">No - El recurso está en buen estado</option>
            <option value="true">Sí - El recurso presenta daños</option>
          </select>
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
              "↩️ Registrar Devolución"
            )}
          </button>
        </div>

        <div className="form-note">
          <p>
            <strong>Nota importante:</strong> Las devoluciones anticipadas
            (antes del horario de fin) no generan fallo de servicio. Solo se
            marca fallo si la devolución se realiza
            <strong> más de 5 minutos después</strong> del horario programado de
            fin.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ReturnForm;
