import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import { useResourceAvailability } from "../hooks/useResourceAvailability";
import "react-datepicker/dist/react-datepicker.css";
import "./ReservationCalendar.css";

const ReservationCalendar = ({ 
  resource, 
  resourceType, 
  unit, 
  onCreateReservation,
  onCancel 
}) => {
  // Fecha por defecto: mañana a las 9:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  
  const { 
    checkingAvailability, 
    availabilityResult, 
    availableSlots,
    loadingSlots,
    checkAvailability, 
    getAvailableSlots,
    clearAvailabilityResult 
  } = useResourceAvailability();

  // Cargar slots disponibles cuando cambia la fecha o el recurso
  useEffect(() => {
    if (resource && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, resource]);

  // Limpiar resultados cuando cambia la fecha/hora
  useEffect(() => {
    clearAvailabilityResult();
  }, [selectedDate, startTime, endTime]);

  const loadAvailableSlots = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('📅 Cargando slots para:', {
        recurso: resource.name,
        fecha: dateStr
      });
      
      const result = await getAvailableSlots(resource.id, dateStr);
      
      if (result && result.length > 0) {
        // Extraer solo los horarios disponibles para los selects
        const availableSlotsList = result
          .filter(slot => slot.isAvailable)
          .map(slot => slot.startTimeFormatted);
      
        console.log('⏰ Horarios disponibles encontrados:', availableSlotsList);
        setAvailableTimeSlots(availableSlotsList);

        // Si hay slots disponibles, establecer valores por defecto
        if (availableSlotsList.length > 0) {
          setStartTime(availableSlotsList[0]);
          // Buscar siguiente slot para la hora de fin
          const nextSlotIndex = 1;
          const endTimeValue = availableSlotsList[nextSlotIndex] || availableSlotsList[0];
          setEndTime(endTimeValue);
        } else {
          // Si no hay slots disponibles, resetear a valores por defecto
          setStartTime("09:00");
          setEndTime("10:00");
        }
      } else {
        console.warn('⚠️ No se recibieron slots del servidor o están vacíos');
        setAvailableTimeSlots([]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando slots:', error);
      setAvailableTimeSlots([]);
      // En caso de error, usar horarios por defecto
      setStartTime("09:00");
      setEndTime("10:00");
    }
  };

  // Función para generar opciones de tiempo
  const generateTimeOptions = () => {
    if (availableTimeSlots.length > 0) {
      return availableTimeSlots;
    }
    
    // Fallback: horarios predeterminados
    return [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
      "17:00", "17:30", "18:00"
    ];
  };

  const handleCheckAvailability = async () => {
    try {
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      console.log('🔍 Verificando disponibilidad:');
      console.log('   Start:', startDateTime.toISOString());
      console.log('   End:', endDateTime.toISOString());

      // Validaciones del frontend
      if (startDateTime >= endDateTime) {
        alert("❌ La hora de fin debe ser posterior a la hora de inicio");
        return;
      }

      if (startDateTime < new Date()) {
        alert("❌ No se pueden hacer reservas en el pasado");
        return;
      }

      // Verificar que los horarios seleccionados estén disponibles
      const isStartTimeAvailable = availableTimeSlots.includes(startTime);
      const isEndTimeAvailable = availableTimeSlots.includes(endTime);

      if (!isStartTimeAvailable || !isEndTimeAvailable) {
        alert("⚠️ Los horarios seleccionados pueden no estar disponibles. Por favor verifica la disponibilidad.");
      }

      await checkAvailability(resource.id, startDateTime.toISOString(), endDateTime.toISOString());
      
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      alert("Error al verificar disponibilidad: " + error.message);
    }
  };

  const handleCreateReservation = async () => {
    if (!purpose.trim()) {
      alert("❌ Por favor, ingresa el propósito de la reserva");
      return;
    }

    if (parseInt(attendees) < 1) {
      alert("❌ El número de asistentes debe ser al menos 1");
      return;
    }

    try {
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      // Validaciones finales
      if (startDateTime >= endDateTime) {
        alert("❌ La hora de fin debe ser posterior a la hora de inicio");
        return;
      }

      if (startDateTime < new Date()) {
        alert("❌ No se pueden crear reservas en el pasado");
        return;
      }

      // Si hay resultado de disponibilidad, verificar que sea positiva
      if (availabilityResult && !availabilityResult.isAvailable) {
        alert("❌ No se puede crear la reserva: " + (availabilityResult.message || "El recurso no está disponible"));
        return;
      }

      const reservationData = {
        resourceId: resource.id,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        purpose: purpose.trim(),
        attendees: parseInt(attendees),
        isRepetitive: false
      };

      console.log('📦 Enviando datos de reserva:', reservationData);
      await onCreateReservation(reservationData);

    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      alert("Error al crear la reserva: " + error.message);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Limpiar selecciones de tiempo al cambiar fecha
    setStartTime("09:00");
    setEndTime("10:00");
  };

  const timeOptions = generateTimeOptions();
  const isFormValid = purpose.trim() && startTime && endTime && parseInt(attendees) >= 1;

  // Formatear fecha para mostrar
  const formattedDate = selectedDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="reservation-calendar">
      <div className="calendar-header">
        <h2>Reservar {resource.name}</h2>
        <p className="resource-path">{unit?.name} - {resourceType?.name}</p>
        <div className="resource-details">
          <span className="granularity-info">
            ⚙️ Granularidad: {resourceType?.granularity || 30} minutos
          </span>
        </div>
      </div>

      <div className="calendar-content">
        {/* Información de slots cargados */}
        <div className="slots-info-card">
          {loadingSlots ? (
            <div className="loading-slots">
              <div className="loading-spinner-small"></div>
              <span>Cargando horarios disponibles...</span>
            </div>
          ) : (
            <div className="slots-summary">
              <span className="slots-count">
                📊 {availableTimeSlots.length} horarios disponibles
              </span>
              <span className="selected-date">{formattedDate}</span>
            </div>
          )}
        </div>

        {/* Selección de fecha */}
        <div className="form-group">
          <label htmlFor="date-picker">📅 Fecha de reserva:</label>
          <DatePicker
            id="date-picker"
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={new Date()}
            locale={es}
            dateFormat="dd/MM/yyyy"
            className="date-picker"
            placeholderText="Selecciona una fecha"
          />
        </div>

        {/* Selección de horario */}
        <div className="time-selection">
          <div className="form-group">
            <label htmlFor="start-time">🕐 Hora de inicio:</label>
            <select 
              id="start-time"
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)}
              className="time-select"
              disabled={loadingSlots}
            >
              {timeOptions.map(slot => (
                <option 
                  key={`start-${slot}`} 
                  value={slot}
                  disabled={!availableTimeSlots.includes(slot)}
                >
                  {slot} {availableTimeSlots.includes(slot) ? '✅' : '❌'}
                </option>
              ))}
            </select>
            {loadingSlots && <small className="loading-text">Cargando horarios...</small>}
          </div>

          <div className="form-group">
            <label htmlFor="end-time">🕒 Hora de fin:</label>
            <select 
              id="end-time"
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)}
              className="time-select"
              disabled={loadingSlots}
            >
              {timeOptions.map(slot => (
                <option 
                  key={`end-${slot}`} 
                  value={slot}
                  disabled={!availableTimeSlots.includes(slot)}
                >
                  {slot} {availableTimeSlots.includes(slot) ? '✅' : '❌'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Previsualización de slots del día */}
        {availableSlots && availableSlots.length > 0 && (
          <div className="available-slots-preview">
            <h4>📋 Horarios del día:</h4>
            <div className="slots-grid">
              {availableSlots.slice(0, 8).map((slot, index) => (
                <div 
                  key={index} 
                  className={`slot-item ${slot.isAvailable ? 'available' : 'occupied'} ${
                    slot.startTimeFormatted === startTime ? 'selected' : ''
                  }`}
                  title={slot.isAvailable ? 'Disponible' : 'Ocupado'}
                >
                  <span className="slot-time">{slot.startTimeFormatted} - {slot.endTimeFormatted}</span>
                  <span className="slot-status">
                    {slot.isAvailable ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
            {availableSlots.length > 8 && (
              <small className="more-slots">
                ... y {availableSlots.length - 8} horarios más
              </small>
            )}
          </div>
        )}

        {/* Detalles de la reserva */}
        <div className="form-group">
          <label htmlFor="purpose">📝 Propósito de la reserva:</label>
          <textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe el propósito de esta reserva (reunión, estudio, trabajo en equipo, etc.)..."
            rows="3"
            className="purpose-textarea"
          />
        </div>

        <div className="form-group">
          <label htmlFor="attendees">👥 Número de asistentes:</label>
          <input
            id="attendees"
            type="number"
            min="1"
            max="50"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            className="attendees-input"
          />
        </div>

        {/* Verificación de disponibilidad */}
        <div className="availability-section">
          <button 
            onClick={handleCheckAvailability}
            disabled={checkingAvailability || !startTime || !endTime}
            className="btn-check-availability"
          >
            {checkingAvailability ? (
              <>
                <div className="reserve-spinner"></div>
                Verificando...
              </>
            ) : (
              '🔍 Verificar Disponibilidad'
            )}
          </button>

          {availabilityResult && (
            <div className={`availability-result ${availabilityResult.isAvailable ? 'available' : 'unavailable'}`}>
              {availabilityResult.isAvailable ? (
                <div className="available-message">
                  ✅ {availabilityResult.message || "El recurso está disponible"}
                </div>
              ) : (
                <div className="unavailable-message">
                  ❌ {availabilityResult.message || "El recurso no está disponible"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="calendar-actions">
          <button onClick={onCancel} className="btn-cancel">
            ↩️ Cancelar
          </button>
          <button 
            onClick={handleCreateReservation}
            disabled={!isFormValid || checkingAvailability || (availabilityResult && !availabilityResult.isAvailable)}
            className="btn-confirm-reservation"
            title={!isFormValid ? "Completa todos los campos requeridos" : ""}
          >
            {checkingAvailability ? (
              <>
                <div className="reserve-spinner"></div>
                Creando...
              </>
            ) : (
              '✅ Confirmar Reserva'
            )}
          </button>
        </div>

        {/* Información de ayuda */}
        <div className="help-info">
          <h4>💡 Información importante:</h4>
          <ul>
            <li>Selecciona una fecha y verifica los horarios disponibles</li>
            <li>Los horarios marcados con ✅ están disponibles</li>
            <li>Verifica la disponibilidad antes de confirmar</li>
            <li>La granularidad mínima es de {resourceType?.granularity || 30} minutos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;