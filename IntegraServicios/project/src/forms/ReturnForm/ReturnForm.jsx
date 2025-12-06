import React, { useState, useEffect } from "react";
import { createReturnApi } from "../../api/loan/returns";
import "./ReturnForm.css";

const ReturnForm = ({ loan, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    loanId: loan?.id || "",
    returnTime: "",
    resourceCondition: "excelente",
    notes: "",
    hasDamage: false,
    damageDescription: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeInfo, setTimeInfo] = useState(null);

  useEffect(() => {
    if (loan) {
      const now = new Date();
      const reservationEnd = new Date(loan.Reservation?.endDateTime);
      const timeDiff = (now - reservationEnd) / (1000 * 60);
      const hasFailure = Math.abs(timeDiff) > 5;

      setTimeInfo({
        reservationEnd,
        currentTime: now,
        timeDiff,
        hasFailure,
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

      const returnData = {
        loanId: formData.loanId,
        returnTime: new Date(formData.returnTime).toISOString(),
        resourceCondition: formData.resourceCondition,
        notes: formData.notes,
        hasDamage: formData.hasDamage,
        damageDescription: formData.hasDamage ? formData.damageDescription : "",
      };

      const response = await createReturnApi(returnData);

      if (response.success) {
        const message = response.message;
        const details = response.timeInfo;

        alert(
          `✅ ${message}\n\n📊 Detalles:\n• Hora programada de fin: ${new Date(
            details.reservationEnd
          ).toLocaleString()}\n• Hora de devolución: ${new Date(
            details.actualReturn
          ).toLocaleString()}\n• Diferencia: ${
            details.timeDifference
          }\n• Estado: ${
            details.withinWindow
              ? "✅ Dentro de ventana"
              : "⚠️ Fuera de ventana"
          }`
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
        <p>No se encontró información del préstamo</p>
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
            <span className="info-label">Entrega realizada:</span>
            <span className="info-value">
              {new Date(loan.deliveryTime).toLocaleString()}
              <small>
                {loan.hasFailure ? "⚠️ Con fallo de servicio" : "✅ Sin fallo"}
              </small>
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Entregado por:</span>
            <span className="info-value">
              {loan.Employee?.firstName} {loan.Employee?.lastName}
              <small>ID: {loan.Employee?.identificationNumber}</small>
            </span>
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
                  ? "Fuera de ventana de devolución"
                  : "Dentro de ventana de devolución"}
              </h4>
              <p>
                Diferencia: {Math.abs(Math.round(timeInfo.timeDiff))} minutos
                {timeInfo.timeDiff > 0 ? " después" : " antes"} del horario
                programado de fin
              </p>
              <small>
                Ventana permitida: ±5 minutos del horario de fin de la reserva
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
          <label htmlFor="resourceCondition">
            Estado del recurso al devolver *
            <small>
              Condición en que se encuentra el recurso al momento de la
              devolución
            </small>
          </label>
          <select
            id="resourceCondition"
            name="resourceCondition"
            value={formData.resourceCondition}
            onChange={handleChange}
            required
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
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="hasDamage"
              name="hasDamage"
              checked={formData.hasDamage}
              onChange={handleChange}
              className="checkbox-input"
            />
            <label htmlFor="hasDamage" className="checkbox-label">
              El recurso presenta daños
            </label>
          </div>
        </div>

        {formData.hasDamage && (
          <div className="form-group">
            <label htmlFor="damageDescription">
              Descripción del daño *
              <small>Describa en detalle los daños encontrados</small>
            </label>
            <textarea
              id="damageDescription"
              name="damageDescription"
              value={formData.damageDescription}
              onChange={handleChange}
              rows="3"
              required
              className="form-control"
              placeholder="Ej: Pantalla rayada, botón roto, cable dañado, etc."
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">
            Observaciones
            <small>Notas adicionales sobre la devolución</small>
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="form-control"
            placeholder="Ej: Usuario reportó funcionamiento normal, batería baja, accesorios completos, etc."
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
              "↩️ Registrar Devolución"
            )}
          </button>
        </div>

        <div className="form-note">
          <p>
            <strong>Nota:</strong> El sistema calculará automáticamente si hubo
            fallo de servicio basándose en la diferencia entre la hora
            programada de fin y la hora de devolución. Falla de servicio =
            diferencia mayor a ±5 minutos.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ReturnForm;
