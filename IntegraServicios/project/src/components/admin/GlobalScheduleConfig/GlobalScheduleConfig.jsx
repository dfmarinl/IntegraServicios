import React, { useState, useEffect } from "react";
import {
  getCompleteUnitScheduleApi,
  addMultipleSchedulesApi,
  updateUnitScheduleApi,
  toggleDayScheduleApi,
} from "../../../api/unit/unitsSchedule";
import "./GlobalScheduleConfig.css";

const GlobalScheduleConfig = ({ unit }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const daysOfWeek = [
    { id: "lunes", label: "Lunes" },
    { id: "martes", label: "Martes" },
    { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" },
    { id: "viernes", label: "Viernes" },
    { id: "sabado", label: "Sábado" },
    { id: "domingo", label: "Domingo" },
  ];

  useEffect(() => {
    loadSchedule();
  }, [unit?.id]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await getCompleteUnitScheduleApi(unit.id);
      setSchedule(data);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayId, field, value) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayId ? { ...day, [field]: value } : day
      )
    );
  };

  const handleToggleDay = async (dayId, isActive) => {
    try {
      await toggleDayScheduleApi(unit.id, dayId, isActive);
      setSchedule((prev) =>
        prev.map((day) =>
          day.dayOfWeek === dayId ? { ...day, isActive } : day
        )
      );
      setMessage({
        type: "success",
        text: `${dayId.charAt(0).toUpperCase() + dayId.slice(1)} ${
          isActive ? "activado" : "desactivado"
        } correctamente`,
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Filtrar días que tienen horario configurado
      const schedulesToSave = schedule
        .filter((day) => day.startTime && day.endTime && day.exists)
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: day.isActive,
        }));

      if (schedulesToSave.length === 0) {
        setMessage({
          type: "error",
          text: "No hay horarios configurados para guardar",
        });
        return;
      }

      await addMultipleSchedulesApi(unit.id, schedulesToSave);
      setMessage({ type: "success", text: "Horarios guardados correctamente" });
      await loadSchedule(); // Recargar datos actualizados
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAll = (templateDay) => {
    if (!templateDay.startTime || !templateDay.endTime) {
      setMessage({ type: "error", text: "Primero configura el día plantilla" });
      return;
    }

    setSchedule((prev) =>
      prev.map((day) => ({
        ...day,
        startTime: templateDay.startTime,
        endTime: templateDay.endTime,
        isActive: templateDay.isActive,
      }))
    );

    setMessage({
      type: "success",
      text: "Horario aplicado a todos los días",
    });
  };

  if (loading) {
    return (
      <div className="schedule-loading">
        <div className="loading-spinner"></div>
        <p>Cargando horarios...</p>
      </div>
    );
  }

  return (
    <div className="global-schedule-config">
      {/* Mensajes */}
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      {/* Instrucciones */}
      <div className="schedule-instructions">
        <p>
          Configura los horarios de operación para <strong>{unit?.name}</strong>
          . Los días desactivados no estarán disponibles para reservas.
        </p>
      </div>

      {/* Plantilla rápida */}
      <div className="quick-template">
        <h4>Plantilla Rápida</h4>
        <div className="template-controls">
          <div className="time-inputs">
            <input
              type="time"
              placeholder="08:00"
              onChange={(e) =>
                handleTimeChange("lunes", "startTime", e.target.value)
              }
            />
            <span>a</span>
            <input
              type="time"
              placeholder="17:00"
              onChange={(e) =>
                handleTimeChange("lunes", "endTime", e.target.value)
              }
            />
          </div>
          <button
            className="btn-template"
            onClick={() =>
              handleApplyToAll(schedule.find((d) => d.dayOfWeek === "lunes"))
            }
          >
            Aplicar a Todos
          </button>
        </div>
      </div>

      {/* Lista de días */}
      <div className="schedule-list">
        {schedule.map((day) => (
          <DayScheduleItem
            key={day.dayOfWeek}
            day={day}
            onTimeChange={handleTimeChange}
            onToggle={handleToggleDay}
          />
        ))}
      </div>

      {/* Acciones */}
      <div className="schedule-actions">
        <button
          className="btn-save"
          onClick={handleSaveSchedule}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar Horarios"}
        </button>
      </div>
    </div>
  );
};

// Componente individual para cada día
const DayScheduleItem = ({ day, onTimeChange, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`day-schedule-item ${!day.isActive ? "inactive" : ""}`}>
      <div className="day-header">
        <div className="day-info">
          <span className="day-name">
            {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)}
          </span>
          <div className="day-times">
            {day.startTime && day.endTime ? (
              <>
                <span className="time">{day.startTime.slice(0, 5)}</span>
                <span className="time-separator">-</span>
                <span className="time">{day.endTime.slice(0, 5)}</span>
              </>
            ) : (
              <span className="no-schedule">Sin horario</span>
            )}
          </div>
        </div>

        <div className="day-actions">
          <button
            className={`toggle-btn ${day.isActive ? "active" : "inactive"}`}
            onClick={() => onToggle(day.dayOfWeek, !day.isActive)}
          >
            {day.isActive ? "Activo" : "Inactivo"}
          </button>
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="day-details">
          <div className="time-inputs">
            <div className="time-group">
              <label>Hora inicio:</label>
              <input
                type="time"
                value={day.startTime || ""}
                onChange={(e) =>
                  onTimeChange(day.dayOfWeek, "startTime", e.target.value)
                }
              />
            </div>
            <div className="time-group">
              <label>Hora fin:</label>
              <input
                type="time"
                value={day.endTime || ""}
                onChange={(e) =>
                  onTimeChange(day.dayOfWeek, "endTime", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalScheduleConfig;
