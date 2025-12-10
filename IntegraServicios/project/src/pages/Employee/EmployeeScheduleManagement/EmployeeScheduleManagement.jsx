import { useState, useEffect } from "react";
import { getMeApi } from "../../../api/user/auth";
import {
  getCompleteUnitScheduleApi,
  addMultipleSchedulesApi,
  updateAllSchedulesApi,
} from "../../../api/unit/unitsSchedule";
import "./EmployeeScheduleManagement.css";

// Función auxiliar para detectar horarios reales
const hasRealScheduleData = (day) => {
  return day.exists && day.id && day.startTime && day.endTime;
};

const EmployeeScheduleManagement = () => {
  const [userData, setUserData] = useState(null);
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
    loadUserAndSchedule();
  }, []);

  const loadUserAndSchedule = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const user = await getMeApi(token);
      setUserData(user);

      if (!user.unitId) {
        setMessage({
          type: "error",
          text: "No tienes una unidad asignada. Contacta al administrador.",
        });
        setLoading(false);
        return;
      }

      await loadSchedule(user.unitId);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setMessage({
        type: "error",
        text: "Error al cargar información del usuario",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSchedule = async (unitId) => {
    try {
      setMessage({ type: "", text: "" });

      const data = await getCompleteUnitScheduleApi(unitId);
      console.log("📅 Datos COMPLETOS de la API:", data);

      if (!data || data.length === 0) {
        console.log("🆕 NO hay datos - creando horarios vacíos");
        const emptySchedule = daysOfWeek.map((day) => ({
          dayOfWeek: day.id,
          startTime: "",
          endTime: "",
          isActive: true,
          exists: false,
          id: null,
        }));
        setSchedule(emptySchedule);
      } else {
        console.log("📋 Procesando datos existentes de la API");
        const processedData = daysOfWeek.map((dayObj) => {
          const existingDay = data.find((d) => d.dayOfWeek === dayObj.id);

          if (
            existingDay &&
            existingDay.id &&
            (existingDay.startTime || existingDay.endTime)
          ) {
            console.log(
              `✅ ${dayObj.id}: Existe en BD con datos reales`,
              existingDay
            );
            return {
              ...existingDay,
              exists: true,
              startTime: existingDay.startTime
                ? existingDay.startTime.substring(0, 5)
                : "",
              endTime: existingDay.endTime
                ? existingDay.endTime.substring(0, 5)
                : "",
            };
          } else {
            console.log(`❌ ${dayObj.id}: NO existe en BD o no tiene datos`);
            return {
              dayOfWeek: dayObj.id,
              startTime: "",
              endTime: "",
              isActive: true,
              exists: false,
              id: null,
            };
          }
        });

        setSchedule(processedData);
      }
    } catch (error) {
      console.error("Error cargando horario:", error);
      setMessage({
        type: "error",
        text: error.message || "Error al cargar horarios",
      });

      const emptySchedule = daysOfWeek.map((day) => ({
        dayOfWeek: day.id,
        startTime: "",
        endTime: "",
        isActive: true,
        exists: false,
        id: null,
      }));
      setSchedule(emptySchedule);
    }
  };

  const handleTimeChange = (dayId, field, value) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayId ? { ...day, [field]: value } : day
      )
    );
  };

  const handleToggleDay = (dayId, isActive) => {
    setSchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayId ? { ...day, isActive } : day))
    );
  };

  // Función para GUARDAR NUEVOS horarios
  const handleSaveNewSchedules = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const schedulesToCreate = schedule
        .filter((day) => day.startTime && day.endTime)
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime + ":00",
          endTime: day.endTime + ":00",
          isActive: day.isActive,
        }));

      console.log("🆕 Creando nuevos horarios:", schedulesToCreate);

      if (schedulesToCreate.length === 0) {
        setMessage({
          type: "error",
          text: "No hay horarios configurados para guardar",
        });
        return;
      }

      await addMultipleSchedulesApi(userData.unitId, schedulesToCreate);
      setMessage({
        type: "success",
        text: "Horarios guardados correctamente",
      });
      await loadSchedule(userData.unitId);
    } catch (error) {
      console.error("❌ Error guardando horarios:", error);
      setMessage({
        type: "error",
        text: error.message || "Error al guardar horarios",
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para ACTUALIZAR horarios
  const handleUpdateSchedules = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      const schedulesToUpdate = schedule.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime ? day.startTime + ":00" : null,
        endTime: day.endTime ? day.endTime + ":00" : null,
        isActive: day.isActive,
      }));

      console.log("🔄 Actualizando horarios:", schedulesToUpdate);

      await updateAllSchedulesApi(userData.unitId, schedulesToUpdate);
      setMessage({
        type: "success",
        text: "Horarios actualizados correctamente",
      });
      await loadSchedule(userData.unitId);
    } catch (error) {
      console.error("❌ Error actualizando horarios:", error);
      setMessage({
        type: "error",
        text: error.message || "Error al actualizar horarios",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToAll = (templateDay) => {
    if (!templateDay.startTime || !templateDay.endTime) {
      setMessage({
        type: "error",
        text: "Primero configura el día plantilla",
      });
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

  const handleResetSchedule = () => {
    const resetSchedule = daysOfWeek.map((day) => ({
      dayOfWeek: day.id,
      startTime: "",
      endTime: "",
      isActive: true,
      exists: false,
      id: null,
    }));
    setSchedule(resetSchedule);
    setMessage({ type: "success", text: "Horarios reseteados" });
  };

  // LÓGICA CORREGIDA - Solo considerar "existentes" los que tienen datos reales
  const hasExistingSchedules = schedule.some((day) => hasRealScheduleData(day));
  const hasConfiguredSchedules = schedule.some(
    (day) => day.startTime && day.endTime
  );
  const existingCount = schedule.filter((day) =>
    hasRealScheduleData(day)
  ).length;
  const configuredCount = schedule.filter(
    (day) => day.startTime && day.endTime
  ).length;

  console.log("🔍 DEBUG CORREGIDO:", {
    hasExistingSchedules,
    existingCount,
    configuredCount,
    botonQueSeMuestra: hasExistingSchedules ? "ACTUALIZAR" : "GUARDAR NUEVOS",
    diasReales: schedule
      .filter((day) => hasRealScheduleData(day))
      .map((d) => d.dayOfWeek),
  });

  if (loading) {
    return (
      <div className="employee-schedule-management">
        <div className="schedule-loading">
          <div className="loading-spinner"></div>
          <p>Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!userData?.unitId) {
    return (
      <div className="employee-schedule-management">
        <div className="no-unit-container">
          <div className="no-unit-icon">⚠️</div>
          <h2>Sin Unidad Asignada</h2>
          <p>
            No tienes una unidad asignada. Por favor, contacta al administrador
            para que te asigne una unidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-schedule-management">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          ⏰ Configuración de Horarios -{" "}
          <span className="unit-name">{userData?.unit?.name}</span>
        </h1>
        <p className="page-subtitle">
          Gestiona los días y horarios de operación de tu unidad
        </p>
      </div>

      {/* Contenido principal */}
      <div className="schedule-content">
        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <div className="schedule-instructions">
          <p>
            Configura los horarios de operación para{" "}
            <strong>{userData?.unit?.name}</strong>. Los días desactivados no
            estarán disponibles para reservas.
          </p>

          <p className="modify-instruction">
            {hasExistingSchedules ? (
              <>
                💡 <strong>Actualiza</strong> los horarios después de realizar
                cambios. ({existingCount} horarios reales existentes)
              </>
            ) : (
              <>
                💡 <strong>Guarda</strong> los nuevos horarios. (Sin horarios
                guardados)
              </>
            )}
          </p>
        </div>

        {/* DEBUG VISUAL */}
        <div
          className="debug-info"
          style={{
            background: hasExistingSchedules ? "#fff3cd" : "#d1ecf1",
            padding: "8px",
            borderRadius: "4px",
            marginBottom: "16px",
            border: `2px solid ${hasExistingSchedules ? "#ffc107" : "#0dcaf0"}`,
          }}
        >
          <small>
            🔍 <strong>ESTADO:</strong>
            <span
              style={{
                color: hasExistingSchedules ? "#856404" : "#055160",
              }}
            >
              {hasExistingSchedules
                ? ` 📁 HAY ${existingCount} HORARIOS REALES → Botón: ACTUALIZAR`
                : ` 🆕 SIN HORARIOS EXISTENTES → Botón: GUARDAR NUEVOS`}
            </span>
          </small>
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

        {/* ACCIONES */}
        <div className="schedule-actions">
          <button
            className="btn-reset"
            onClick={handleResetSchedule}
            disabled={saving}
          >
            Reiniciar Horarios
          </button>

          {hasExistingSchedules ? (
            <button
              className="btn-update"
              onClick={handleUpdateSchedules}
              disabled={saving}
            >
              {saving ? "Actualizando..." : "Actualizar Horarios"}
            </button>
          ) : (
            <button
              className="btn-save"
              onClick={handleSaveNewSchedules}
              disabled={saving || !hasConfiguredSchedules}
            >
              {saving ? "Guardando..." : "Guardar Nuevos Horarios"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// COMPONENTE INDIVIDUAL PARA CADA DÍA
const DayScheduleItem = ({ day, onTimeChange, onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasValidSchedule =
    day.startTime && day.endTime && day.startTime < day.endTime;
  const isRealSchedule = hasRealScheduleData(day);

  return (
    <div
      className={`day-schedule-item ${!day.isActive ? "inactive" : ""} ${
        isRealSchedule ? "exists" : "new"
      }`}
    >
      <div className="day-header">
        <div className="day-info">
          <span className="day-name">
            {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)}
            {isRealSchedule ? (
              <span className="exists-badge"> (Real)</span>
            ) : day.exists ? (
              <span className="fake-badge"> (Falso)</span>
            ) : (
              <span className="new-badge"> (Nuevo)</span>
            )}
          </span>
          <div className="day-times">
            {day.startTime && day.endTime ? (
              <>
                <span className="time">{day.startTime}</span>
                <span className="time-separator">-</span>
                <span className="time">{day.endTime}</span>
                {!hasValidSchedule && (
                  <span className="invalid-badge">⚠️ Inválido</span>
                )}
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
            title={day.isActive ? "Desactivar día" : "Activar día"}
          >
            {day.isActive ? "✅" : "❌"}
          </button>
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Contraer" : "Expandir"}
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
          <div className="day-status">
            <small>
              Estado real: <strong>{isRealSchedule ? "SÍ" : "NO"}</strong> | ID:{" "}
              <strong>{day.id || "Sin ID"}</strong> | Exists:{" "}
              <strong>{day.exists ? "Sí" : "No"}</strong>
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeScheduleManagement;
