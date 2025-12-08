import React, { useState, useEffect } from "react";
import {
  getCompleteTypeScheduleApi,
  addMultipleSchedulesApi,
  updateAllTypeSchedulesApi
} from "../../../api/Resource/typeSchedule";
import "./TypeScheduleConfig.css";

// Función auxiliar para detectar horarios reales
const hasRealScheduleData = (day) => {
  return day.exists && day.id && day.startTime && day.endTime;
};

const TypeScheduleConfig = ({ resourceType }) => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [unitSchedule, setUnitSchedule] = useState(null);

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
    if (resourceType?.id) {
      loadSchedule();
    }
  }, [resourceType?.id]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      
      const data = await getCompleteTypeScheduleApi(resourceType.id);
      console.log("📅 Datos COMPLETOS del tipo de recurso:", data);
      
      // Extraer horarios de la unidad para validaciones
      if (data.resourceType?.unitSchedules) {
        setUnitSchedule(data.resourceType.unitSchedules);
      }
      
      const typeSchedules = data.resourceType?.schedules || [];
      
      if (!typeSchedules || typeSchedules.length === 0) {
        console.log("🆕 NO hay datos - creando horarios vacíos");
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
        console.log("📋 Procesando datos existentes del tipo de recurso");
        const processedData = daysOfWeek.map(dayObj => {
          const existingDay = typeSchedules.find(d => d.dayOfWeek === dayObj.id);
          
          if (existingDay && existingDay.id && (existingDay.startTime || existingDay.endTime)) {
            console.log(`✅ ${dayObj.id}: Existe en BD con datos reales`, existingDay);
            return {
              ...existingDay,
              exists: true,
              startTime: existingDay.startTime ? formatTimeForInput(existingDay.startTime) : "",
              endTime: existingDay.endTime ? formatTimeForInput(existingDay.endTime) : "",
            };
          } else {
            console.log(`❌ ${dayObj.id}: NO existe en BD o no tiene datos`);
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
        
        setSchedule(processedData);
      }
    } catch (error) {
      console.error("Error cargando horario del tipo de recurso:", error);
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

  // Función para formatear tiempo para input type="time"
  const formatTimeForInput = (timeStr) => {
    if (!timeStr) return "";
    // Si ya está en formato HH:MM, devolverlo
    if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr;
    // Si tiene segundos, removerlos
    if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr.substring(0, 5);
    // Si es un objeto Date o otro formato, convertirlo
    return timeStr;
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

  const handleToggleDay = (dayId, isActive) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayId ? { ...day, isActive } : day
      )
    );
  };

  // NUEVA FUNCIÓN: Ajustar al horario de la unidad
  const handleAdjustToUnitSchedule = () => {
    if (!unitSchedule || unitSchedule.length === 0) {
      setMessage({ 
        type: "error", 
        text: "No hay horario de unidad disponible para ajustar" 
      });
      return;
    }

    const adjustedSchedule = schedule.map(day => {
      const unitDay = unitSchedule.find(unit => unit.dayOfWeek === day.dayOfWeek);
      
      if (unitDay && unitDay.isActive) {
        // Solo ajustar si la unidad tiene horario activo para este día
        return {
          ...day,
          startTime: formatTimeForInput(unitDay.startTime),
          endTime: formatTimeForInput(unitDay.endTime),
          isActive: true // Activar el día si la unidad lo tiene activo
        };
      } else {
        // Si la unidad no tiene horario para este día, desactivarlo
        return {
          ...day,
          startTime: "",
          endTime: "",
          isActive: false
        };
      }
    });

    setSchedule(adjustedSchedule);
    
    // Contar días ajustados
    const adjustedDays = adjustedSchedule.filter(day => 
      day.startTime && day.endTime && day.isActive
    ).length;
    
    setMessage({ 
      type: "success", 
      text: `Horario ajustado al de la unidad (${adjustedDays} días configurados)` 
    });
  };

  // Función para GUARDAR NUEVOS horarios - CORREGIDA
  const handleSaveNewSchedules = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Filtrar solo días con horarios completos y válidos
      const schedulesToCreate = schedule
        .filter((day) => {
          const hasTime = day.startTime && day.endTime;
          const isValidTime = day.startTime < day.endTime;
          const isWithinUnitLimits = isValidTimeRange(day);
          
          if (hasTime && !isValidTime) {
            console.warn(`⏰ Horario inválido para ${day.dayOfWeek}: ${day.startTime} - ${day.endTime}`);
          }
          
          if (hasTime && !isWithinUnitLimits) {
            console.warn(`🚫 Horario fuera de límites para ${day.dayOfWeek}`);
          }
          
          return hasTime && isValidTime && isWithinUnitLimits;
        })
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime, // NO agregar ":00" - ya viene en formato correcto
          endTime: day.endTime,     // NO agregar ":00" - ya viene en formato correcto
          isActive: day.isActive,
        }));

      console.log("🆕 Creando nuevos horarios para tipo de recurso:", schedulesToCreate);

      if (schedulesToCreate.length === 0) {
        setMessage({ 
          type: "error", 
          text: "No hay horarios válidos para guardar. Verifica que los horarios estén dentro de los límites de la unidad." 
        });
        return;
      }

      await addMultipleSchedulesApi(resourceType.id, schedulesToCreate);
      setMessage({ 
        type: "success", 
        text: `${schedulesToCreate.length} horarios guardados correctamente` 
      });
      await loadSchedule();
      
    } catch (error) {
      console.error("❌ Error guardando horarios del tipo de recurso:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Error al guardar horarios. Verifica la consola para más detalles." 
      });
    } finally {
      setSaving(false);
    }
  };

  // Función para ACTUALIZAR horarios - CORREGIDA
  const handleUpdateSchedules = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      // Crear array con los horarios actualizados
      const schedulesToUpdate = [];
      
      for (const day of schedule) {
        // Si no tiene horario pero existe en BD, marcarlo como inactivo
        if (hasRealScheduleData(day) && (!day.startTime || !day.endTime)) {
          schedulesToUpdate.push({
            dayOfWeek: day.dayOfWeek,
            startTime: "", // Enviar string vacío
            endTime: "",   // Enviar string vacío
            isActive: false,
          });
        } 
        // Si tiene horario válido, incluirlo
        else if (day.startTime && day.endTime && isValidTimeRange(day)) {
          schedulesToUpdate.push({
            dayOfWeek: day.dayOfWeek,
            startTime: day.startTime,
            endTime: day.endTime,
            isActive: day.isActive,
          });
        }
        // Si no tiene horario y no existe, omitirlo
        else {
          console.log(`⚠️ Omitiendo ${day.dayOfWeek}: sin horario válido`);
        }
      }

      console.log("🔄 Horarios a actualizar:", schedulesToUpdate);

      if (schedulesToUpdate.length === 0) {
        setMessage({ 
          type: "error", 
          text: "No hay cambios válidos para actualizar" 
        });
        return;
      }

      await updateAllTypeSchedulesApi(resourceType.id, schedulesToUpdate);
      setMessage({ 
        type: "success", 
        text: "Horarios actualizados correctamente" 
      });
      await loadSchedule();
      
    } catch (error) {
      console.error("❌ Error actualizando horarios:", error);
      
      // Mostrar mensaje más específico
      if (error.message.includes("Errores de validación")) {
        setMessage({ 
          type: "error", 
          text: "Errores de validación: " + (error.errors ? error.errors.join(', ') : error.message)
        });
      } else {
        setMessage({ 
          type: "error", 
          text: error.message || "Error al actualizar horarios" 
        });
      }
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

  // Obtener límites de la unidad para un día específico - MEJORADA
  const getUnitTimeLimits = (dayOfWeek) => {
    if (!unitSchedule) return null;
    const unitDay = unitSchedule.find(day => day.dayOfWeek === dayOfWeek && day.isActive);
    
    if (!unitDay) return null;
    
    // Asegurar formato correcto (HH:MM)
    const formatTime = (timeStr) => {
      if (!timeStr) return null;
      // Si ya está en formato HH:MM, devolverlo
      if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr;
      // Si tiene segundos, removerlos
      if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr.substring(0, 5);
      return timeStr;
    };
    
    return {
      startTime: formatTime(unitDay.startTime),
      endTime: formatTime(unitDay.endTime)
    };
  };

  // Validar si el horario está dentro de los límites de la unidad - MEJORADA
  const isValidTimeRange = (day) => {
    if (!day.startTime || !day.endTime) return true; // No validar si no hay horario
    
    const unitLimits = getUnitTimeLimits(day.dayOfWeek);
    if (!unitLimits) return false; // No hay horario de unidad para este día
    
    // Convertir a minutos para comparación precisa
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(day.startTime);
    const endMinutes = timeToMinutes(day.endTime);
    const unitStartMinutes = timeToMinutes(unitLimits.startTime);
    const unitEndMinutes = timeToMinutes(unitLimits.endTime);
    
    return startMinutes >= unitStartMinutes && endMinutes <= unitEndMinutes;
  };

  // LÓGICA CORREGIDA - Solo considerar "existentes" los que tienen datos reales
  const hasExistingSchedules = schedule.some(day => hasRealScheduleData(day));
  const hasConfiguredSchedules = schedule.some(day => day.startTime && day.endTime);
  const existingCount = schedule.filter(day => hasRealScheduleData(day)).length;
  const configuredCount = schedule.filter(day => day.startTime && day.endTime).length;

  console.log("🔍 DEBUG TIPO RECURSO:", {
    hasExistingSchedules,
    existingCount,
    configuredCount,
    botonQueSeMuestra: hasExistingSchedules ? "ACTUALIZAR" : "GUARDAR NUEVOS",
    diasReales: schedule.filter(day => hasRealScheduleData(day)).map(d => d.dayOfWeek)
  });

  if (loading) {
    return (
      <div className="schedule-loading">
        <div className="loading-spinner"></div>
        <p>Cargando horarios del tipo de recurso...</p>
      </div>
    );
  }

  return (
    <div className="type-schedule-config">
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="schedule-instructions">
        <p>
          Configura los horarios específicos para <strong>{resourceType?.name}</strong>
          . Los horarios deben estar dentro del rango de la unidad <strong>{resourceType?.unit?.name}</strong>.
        </p>
        
        {unitSchedule && (
          <div className="unit-schedule-info">
            <h4>📋 Horario de la Unidad ({resourceType?.unit?.name})</h4>
            <div className="unit-schedule-grid">
              {unitSchedule.filter(day => day.isActive).map(day => (
                <div key={day.dayOfWeek} className="unit-schedule-item">
                  <span className="unit-day">{day.dayOfWeek}:</span>
                  <span className="unit-time">{formatTimeForInput(day.startTime)} - {formatTimeForInput(day.endTime)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <p className="modify-instruction">
          {hasExistingSchedules ? (
            <>💡 <strong>Actualiza</strong> los horarios después de realizar cambios. ({existingCount} horarios reales existentes)</>
          ) : (
            <>💡 <strong>Guarda</strong> los nuevos horarios. (Sin horarios guardados)</>
          )}
        </p>
      </div>

      {/* DEBUG VISUAL */}
      <div className="debug-info" style={{
        background: hasExistingSchedules ? '#fff3cd' : '#d1ecf1', 
        padding: '8px', 
        borderRadius: '4px', 
        marginBottom: '16px',
        border: `2px solid ${hasExistingSchedules ? '#ffc107' : '#0dcaf0'}`
      }}>
        <small>
          🔍 <strong>ESTADO TIPO RECURSO:</strong> 
          <span style={{color: hasExistingSchedules ? '#856404' : '#055160'}}>
            {hasExistingSchedules 
              ? ` 📁 HAY ${existingCount} HORARIOS REALES → Botón: ACTUALIZAR` 
              : ` 🆕 SIN HORARIOS EXISTENTES → Botón: GUARDAR NUEVOS`
            }
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

      {/* Botón para ajustar al horario de la unidad */}
      {unitSchedule && (
        <div className="unit-adjust-section">
          <h4>Ajustar al Horario de la Unidad</h4>
          <div className="adjust-controls">
            <button
              className="btn-adjust"
              onClick={handleAdjustToUnitSchedule}
              disabled={saving || !unitSchedule.length}
              title="Copiar el horario de la unidad al tipo de recurso"
            >
              ⚙️ Ajustar al Horario de la Unidad
            </button>
            <p className="adjust-info">
              Copiará automáticamente los horarios de la unidad al tipo de recurso
              {unitSchedule.filter(day => day.isActive).length > 0 
                ? ` (${unitSchedule.filter(day => day.isActive).length} días activos)`
                : ' (sin días activos)'}
            </p>
          </div>
        </div>
      )}

      {/* Lista de días */}
      <div className="schedule-list">
        {schedule.map((day) => (
          <TypeDayScheduleItem
            key={day.dayOfWeek}
            day={day}
            onTimeChange={handleTimeChange}
            onToggle={handleToggleDay}
            unitLimits={getUnitTimeLimits(day.dayOfWeek)}
            isValidTimeRange={isValidTimeRange(day)}
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
            disabled={saving || !hasConfiguredSchedules}
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
  );
};

// COMPONENTE INDIVIDUAL PARA CADA DÍA DEL TIPO DE RECURSO - MEJORADO
const TypeDayScheduleItem = ({ day, onTimeChange, onToggle, unitLimits, isValidTimeRange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasValidSchedule = day.startTime && day.endTime && day.startTime < day.endTime;
  const isRealSchedule = hasRealScheduleData(day);
  const hasUnitSchedule = unitLimits !== null;

  // Verificar errores específicos
  const getTimeErrors = () => {
    const errors = [];
    
    if (day.startTime && day.endTime) {
      if (day.startTime >= day.endTime) {
        errors.push("La hora de inicio debe ser menor que la hora de fin");
      }
      
      if (!isValidTimeRange) {
        errors.push(`Fuera de los límites de la unidad (${unitLimits?.startTime} - ${unitLimits?.endTime})`);
      }
    }
    
    return errors;
  };

  const timeErrors = getTimeErrors();

  return (
    <div className={`day-schedule-item ${!day.isActive ? "inactive" : ""} ${isRealSchedule ? 'exists' : 'new'} ${timeErrors.length > 0 ? 'has-errors' : ''}`}>
      <div className="day-header">
        <div className="day-info">
          <span className="day-name">
            {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)}
            {isRealSchedule && <span className="exists-badge"> ✓</span>}
          </span>
          <div className="day-times">
            {day.startTime && day.endTime ? (
              <>
                <span className="time">{day.startTime}</span>
                <span className="time-separator">-</span>
                <span className="time">{day.endTime}</span>
                {timeErrors.length > 0 && (
                  <span className="error-badge" title={timeErrors.join(', ')}>
                    ⚠️ {timeErrors.length} error(es)
                  </span>
                )}
              </>
            ) : (
              <span className="no-schedule">Sin horario</span>
            )}
          </div>
          {unitLimits && (
            <div className="unit-limits">
              <small>Límites: {unitLimits.startTime} - {unitLimits.endTime}</small>
            </div>
          )}
        </div>

        <div className="day-actions">
          <button
            className={`toggle-btn ${day.isActive ? "active" : "inactive"}`}
            onClick={() => onToggle(day.dayOfWeek, !day.isActive)}
            title={day.isActive ? "Desactivar día" : "Activar día"}
            disabled={!hasUnitSchedule} // No se puede activar si la unidad no tiene horario
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
                min={unitLimits?.startTime}
                max={unitLimits?.endTime}
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
                min={unitLimits?.startTime}
                max={unitLimits?.endTime}
              />
            </div>
          </div>
          
          {/* Mostrar errores específicos */}
          {timeErrors.length > 0 && (
            <div className="validation-errors">
              {timeErrors.map((error, index) => (
                <div key={index} className="validation-error">
                  ⚠️ {error}
                </div>
              ))}
            </div>
          )}
          
          <div className="validation-info">
            {!hasUnitSchedule && (
              <div className="validation-warning">
                🔒 La unidad no tiene horario configurado para este día
              </div>
            )}
          </div>
          <div className="day-status">
            <small>
              Estado real: <strong>{isRealSchedule ? "SÍ" : "NO"}</strong> | 
              ID: <strong>{day.id || "Sin ID"}</strong> |
              Activo: <strong>{day.isActive ? "Sí" : "No"}</strong>
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypeScheduleConfig;