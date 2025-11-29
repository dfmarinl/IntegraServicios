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
  const [modifyingDay, setModifyingDay] = useState(null);

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
    if (unit?.id) {
      loadSchedule();
    }
  }, [unit?.id]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      
      const data = await getCompleteUnitScheduleApi(unit.id);
      console.log("📅 Datos COMPLETOS recibidos de la API:", data);
      
      // DEBUG: Verificar si los objetos tienen id
      if (data && data.length > 0) {
        console.log("🔍 VERIFICANDO IDs EN LOS DATOS:");
        data.forEach((item, index) => {
          console.log(`Día ${index} (${item.dayOfWeek}):`, {
            id: item.id,
            hasId: !!item.id,
            allProperties: Object.keys(item)
          });
        });
      }
      
      if (!data || data.length === 0) {
        const emptySchedule = daysOfWeek.map(day => ({
          dayOfWeek: day.id,
          startTime: "",
          endTime: "",
          isActive: true,
          exists: false,
          id: null
        }));
        setSchedule(emptySchedule);
      } else {
        // PROCESAMIENTO CORREGIDO - mantener todas las propiedades originales
        const processedData = daysOfWeek.map(dayObj => {
          const existingDay = data.find(d => d.dayOfWeek === dayObj.id);
          
          if (existingDay) {
            // IMPORTANTE: Mantener todas las propiedades del objeto original
            return {
              ...existingDay, // Esto incluye el id, unitId, etc.
              exists: true,
              // Asegurarnos de que startTime y endTime estén en formato correcto
              startTime: existingDay.startTime ? existingDay.startTime.substring(0, 5) : "",
              endTime: existingDay.endTime ? existingDay.endTime.substring(0, 5) : "",
            };
          } else {
            return {
              dayOfWeek: dayObj.id,
              startTime: "",
              endTime: "",
              isActive: true,
              exists: false,
              id: null
            };
          }
        });
        
        console.log("📊 Datos procesados:", processedData);
        setSchedule(processedData);
      }
    } catch (error) {
      console.error("Error cargando horario:", error);
      setMessage({ type: "error", text: error.message || "Error al cargar horarios" });
      
      const emptySchedule = daysOfWeek.map(day => ({
        dayOfWeek: day.id,
        startTime: "",
        endTime: "",
        isActive: true,
        exists: false,
        id: null
      }));
      setSchedule(emptySchedule);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayId, field, value) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayId ? { 
          ...day, 
          [field]: value
        } : day
      )
    );
  };

  const handleToggleDay = async (dayId, isActive) => {
    try {
      const dayToToggle = schedule.find(day => day.dayOfWeek === dayId);
      
      if (dayToToggle.exists && dayToToggle.id) {
        await updateUnitScheduleApi(dayToToggle.id, { isActive });
      } else {
        await toggleDayScheduleApi(unit.id, dayId, isActive);
      }
      
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

  // FUNCIÓN SIMPLIFICADA Y CORREGIDA
  const handleModifySchedule = async (dayId) => {
    try {
      setModifyingDay(dayId);
      setMessage({ type: "", text: "" });

      const dayToModify = schedule.find(day => day.dayOfWeek === dayId);
      
      if (!dayToModify) {
        setMessage({ type: "error", text: "Día no encontrado" });
        return;
      }

      // Validaciones
      if (!dayToModify.startTime || !dayToModify.endTime) {
        setMessage({ type: "error", text: "Debe configurar tanto hora de inicio como hora de fin" });
        return;
      }

      if (dayToModify.startTime >= dayToModify.endTime) {
        setMessage({ type: "error", text: "La hora de inicio debe ser anterior a la hora de fin" });
        return;
      }

      console.log("🔄 Modificando horario para:", dayId, dayToModify);

      // Preparar datos para enviar
      const scheduleData = {
        dayOfWeek: dayToModify.dayOfWeek,
        startTime: dayToModify.startTime + ":00", // Añadir segundos para el formato TIME de la BD
        endTime: dayToModify.endTime + ":00",     // Añadir segundos para el formato TIME de la BD
        isActive: dayToModify.isActive,
      };

      let response;
      
      // DECISIÓN SIMPLE: Si existe y tiene ID, actualizar; sino, crear
      if (dayToModify.exists && dayToModify.id) {
        console.log("📝 Actualizando horario existente con ID:", dayToModify.id);
        response = await updateUnitScheduleApi(dayToModify.id, scheduleData);
        console.log("✅ Horario actualizado:", response);
      } else {
        console.log("🆕 Creando nuevo horario para:", dayId);
        response = await addMultipleSchedulesApi(unit.id, [scheduleData]);
        console.log("✅ Nuevo horario creado:", response);
      }

      setMessage({ 
        type: "success", 
        text: `Horario del ${dayId.charAt(0).toUpperCase() + dayId.slice(1)} ${
          dayToModify.exists ? 'actualizado' : 'creado'
        } correctamente` 
      });
      
      // Recargar los datos actualizados
      await loadSchedule();
      
    } catch (error) {
      console.error("❌ Error modificando horario:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Error al modificar el horario. Intente nuevamente." 
      });
    } finally {
      setModifyingDay(null);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Filtrar solo días que no existen en la base de datos para crear nuevos
      const schedulesToCreate = schedule
        .filter((day) => day.startTime && day.endTime && !day.exists)
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime + ":00",
          endTime: day.endTime + ":00",
          isActive: day.isActive,
        }));

      console.log("📤 Creando nuevos horarios:", schedulesToCreate);

      if (schedulesToCreate.length === 0) {
        setMessage({
          type: "info",
          text: "No hay nuevos horarios para guardar. Use 'Modificar' para actualizar horarios existentes.",
        });
        return;
      }

      await addMultipleSchedulesApi(unit.id, schedulesToCreate);
      setMessage({ type: "success", text: "Nuevos horarios guardados correctamente" });
      await loadSchedule();
    } catch (error) {
      console.error("Error guardando horario:", error);
      setMessage({ type: "error", text: error.message || "Error al guardar horarios" });
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

  const handleResetSchedule = () => {
    const resetSchedule = daysOfWeek.map(day => ({
      dayOfWeek: day.id,
      startTime: "",
      endTime: "",
      isActive: true,
      exists: false,
      id: null
    }));
    setSchedule(resetSchedule);
    setMessage({ type: "success", text: "Horarios reseteados" });
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
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="schedule-instructions">
        <p>
          Configura los horarios de operación para <strong>{unit?.name}</strong>
          . Los días desactivados no estarán disponibles para reservas.
        </p>
        <p className="modify-instruction">
          💡 <strong>Usa "Modificar"</strong> para guardar cambios individuales en cada día.
          <strong> "Guardar Todos"</strong> solo crea nuevos horarios.
        </p>
      </div>

      {/* Debug info mejorado */}
      <div className="debug-info">
        <small>
          IDs detectados: {schedule.filter(day => day.id).length} de {schedule.length} días
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
            onModify={handleModifySchedule}
            modifyingDay={modifyingDay}
          />
        ))}
      </div>

      {/* Acciones */}
      <div className="schedule-actions">
        <button
          className="btn-reset"
          onClick={handleResetSchedule}
          disabled={saving}
        >
          Reiniciar Horarios
        </button>
        <button
          className="btn-save"
          onClick={handleSaveSchedule}
          disabled={saving}
        >
          {saving ? "Guardando..." : "Guardar Nuevos Horarios"}
        </button>
      </div>
    </div>
  );
};

// COMPONENTE INDIVIDUAL PARA CADA DÍA
const DayScheduleItem = ({ day, onTimeChange, onToggle, onModify, modifyingDay }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasValidSchedule = day.startTime && day.endTime && day.startTime < day.endTime;

  return (
    <div className={`day-schedule-item ${!day.isActive ? "inactive" : ""} ${day.exists ? 'exists' : 'new'}`}>
      <div className="day-header">
        <div className="day-info">
          <span className="day-name">
            {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)}
            
            {!day.exists && <span className="new-badge"> (Nuevo)</span>}
          </span>
          <div className="day-times">
            {day.startTime && day.endTime ? (
              <>
                <span className="time">{day.startTime}</span>
                <span className="time-separator">-</span>
                <span className="time">{day.endTime}</span>
                {!hasValidSchedule && <span className="invalid-badge">⚠️ Horario inválido</span>}
              </>
            ) : (
              <span className="no-schedule">Sin horario configurado</span>
            )}
          </div>
        </div>

        <div className="day-actions">
          <button
            className={`btn-modify ${modifyingDay === day.dayOfWeek ? 'modifying' : ''} ${
              !hasValidSchedule ? 'disabled' : ''
            }`}
            onClick={() => onModify(day.dayOfWeek)}
            disabled={modifyingDay === day.dayOfWeek || !hasValidSchedule}
            title={!hasValidSchedule ? "Configure un horario válido para modificar" : "Guardar cambios en este día"}
          >
            {modifyingDay === day.dayOfWeek ? (
              <>⏳ Modificando...</>
            ) : (
              <>✏️ {day.exists ? 'Actualizar' : 'Crear'}</>
            )}
          </button>
          
          <button
            className={`toggle-btn ${day.isActive ? "active" : "inactive"}`}
            onClick={() => onToggle(day.dayOfWeek, !day.isActive)}
          >
            {day.isActive ? "✅ Activo" : "❌ Inactivo"}
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
          <div className="modify-info">
            <small>
              {day.exists 
                ? (day.id 
                    ? `💡 Horario existente (ID: ${day.id}). Use "Actualizar" para guardar cambios.`
                    : "⚠️ El horario existe pero no se detectó ID. Contacte al administrador."
                  )
                : "💡 Horario nuevo. Use \"Crear\" para guardar en la base de datos."
              }
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalScheduleConfig;
