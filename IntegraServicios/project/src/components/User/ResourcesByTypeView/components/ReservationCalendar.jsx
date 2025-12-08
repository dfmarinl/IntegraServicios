import { useState, useEffect, useCallback, useRef } from "react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import { useResourceAvailability } from "../hooks/useResourceAvailability";
import { getTypeSchedulesApi } from "../../../../api/Resource/typeSchedule";
import "react-datepicker/dist/react-datepicker.css";
import "./ReservationCalendar.css";

const ReservationCalendar = ({ 
  resource, 
  resourceType, 
  unit, 
  onCreateReservation,
  onCancel 
}) => {
  // Ref para evitar múltiples llamadas
  const isFetchingSlots = useRef(false);
  const lastDateFetched = useRef(null);
  
  // Estado para slots filtrados
  const [filteredTimeSlots, setFilteredTimeSlots] = useState([]);
  const [filteredAvailableSlots, setFilteredAvailableSlots] = useState([]);
  
  // Función para obtener fecha inicial segura
  const getInitialDate = useCallback(() => {
    const now = new Date();
    const hour = now.getHours();
    
    // Crear mañana a las 9:00 como fallback
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    // Si es después de las 21:00, NO usar hoy
    if (hour >= 21) {
      return tomorrow;
    }
    
    // Si es antes de las 9:00, usar hoy a las 9:00
    if (hour < 9) {
      const todayAt9 = new Date(now);
      todayAt9.setHours(9, 0, 0, 0);
      return todayAt9;
    }
    
    // Entre 9:00 y 21:00, usar la siguiente hora en punto HOY
    const nextHour = new Date(now);
    nextHour.setHours(hour + 1, 0, 0, 0);
    return nextHour;
  }, []);

  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [attendees, setAttendees] = useState(1);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  
  // Estado para horarios del tipo de recurso
  const [typeSchedules, setTypeSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [typeScheduleError, setTypeScheduleError] = useState("");
  
  // Estado para reservas repetitivas
  const [isRepetitive, setIsRepetitive] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState("weekly");
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatOccurrences, setRepeatOccurrences] = useState(4);
  const [repeatEndDate, setRepeatEndDate] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const [repeatType, setRepeatType] = useState("occurrences");
  
  // Estado para mostrar información de repetición
  const [calculatedDates, setCalculatedDates] = useState([]);
  
  // Estado para error de fecha
  const [dateError, setDateError] = useState("");
  const [isTodaySelected, setIsTodaySelected] = useState(false);
  
  const { 
    checkingAvailability, 
    availabilityResult, 
    availableSlots,
    loadingSlots,
    checkAvailability, 
    getAvailableSlots,
    clearAvailabilityResult 
  } = useResourceAvailability();

  // Cargar horarios del tipo de recurso cuando el componente se monta
  useEffect(() => {
    if (resourceType?.id) {
      loadTypeSchedules();
    }
  }, [resourceType]);

  // Verificar si la fecha seleccionada es hoy
  useEffect(() => {
    const today = new Date();
    const selected = new Date(selectedDate);
    
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    const isToday = today.getTime() === selected.getTime();
    setIsTodaySelected(isToday);
    
    // Si cambia el estado de "hoy", aplicar filtro
    if (availableTimeSlots.length > 0) {
      applyTodayFilter(isToday);
    }
  }, [selectedDate]);

  // Aplicar filtro cuando cambia el estado de "hoy" o los slots
  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      applyTodayFilter(isTodaySelected);
    }
  }, [availableTimeSlots, isTodaySelected]);

  // Aplicar filtro a availableSlots también
  useEffect(() => {
    if (availableSlots && availableSlots.length > 0) {
      applyFilterToAvailableSlots(isTodaySelected);
    }
  }, [availableSlots, isTodaySelected]);

  // Función para aplicar filtro cuando es hoy
  const applyTodayFilter = (isToday) => {
    if (isToday && availableTimeSlots.length > 0) {
      const filtered = filterTodaySlots(availableTimeSlots);
      setFilteredTimeSlots(filtered);
      
      // Si no hay slots filtrados, limpiar selección
      if (filtered.length === 0) {
        setStartTime("");
        setEndTime("");
      } else if (!filtered.includes(startTime)) {
        // Si la hora actual seleccionada no está en los filtrados, seleccionar la primera disponible
        setStartTime(filtered[0]);
        if (filtered.length > 1) {
          setEndTime(filtered[1]);
        }
      }
    } else {
      setFilteredTimeSlots(availableTimeSlots);
    }
  };

  // Función para aplicar filtro a availableSlots
  const applyFilterToAvailableSlots = (isToday) => {
    if (isToday && availableSlots && availableSlots.length > 0) {
      const filtered = availableSlots.filter(slot => {
        const slotTime = slot.startTimeFormatted;
        const now = new Date();
        const minTime = new Date(now.getTime() + 15 * 60 * 1000);
        const currentHour = minTime.getHours();
        const currentMinute = minTime.getMinutes();
        
        // Redondear al siguiente intervalo
        const granularity = resourceType?.granularity || 30;
        const roundedMinutes = Math.ceil(currentMinute / granularity) * granularity;
        
        let nextHour = currentHour;
        let nextMinute = roundedMinutes;
        
        if (nextMinute >= 60) {
          nextHour += 1;
          nextMinute = 0;
        }
        
        const minTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
        
        return slotTime >= minTimeStr;
      });
      setFilteredAvailableSlots(filtered);
    } else {
      setFilteredAvailableSlots(availableSlots || []);
    }
  };

  // Cargar slots disponibles SOLO cuando cambia la fecha o el recurso
  useEffect(() => {
    if (resource && selectedDate && !isFetchingSlots.current) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Evitar llamadas duplicadas para la misma fecha
      if (lastDateFetched.current !== dateStr) {
        loadAvailableSlots();
        lastDateFetched.current = dateStr;
      }
    }
  }, [selectedDate, resource]);

  // Limpiar resultados cuando cambia la fecha/hora
  useEffect(() => {
    clearAvailabilityResult();
    setDateError("");
    setFilteredTimeSlots([]);
    setFilteredAvailableSlots([]);
  }, [selectedDate, startTime, endTime]);

  // Calcular fechas de repetición cuando cambia la configuración
  useEffect(() => {
    if (isRepetitive) {
      calculateRepeatDates();
    } else {
      setCalculatedDates([]);
    }
  }, [isRepetitive, selectedDate, startTime, endTime, repeatFrequency, repeatInterval, 
      repeatOccurrences, repeatEndDate, selectedDays, repeatType]);

  // Función para cargar horarios del tipo de recurso
  const loadTypeSchedules = async () => {
    try {
      setLoadingSchedules(true);
      setTypeScheduleError("");
      
      const response = await getTypeSchedulesApi(resourceType.id);
      const schedulesArray = response.schedules || [];
      setTypeSchedules(schedulesArray);
      
    } catch (error) {
      console.error('❌ Error cargando horarios del tipo:', error);
      setTypeScheduleError("No se pudieron cargar los horarios del tipo de recurso");
      setTypeSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Función para mapear días de la semana en español a números (0-6)
  const mapDayOfWeekToNumber = (dayString) => {
    if (!dayString) return 1; // Default a lunes
    
    const normalizedDay = dayString.toLowerCase().trim();
    
    const dayMap = {
      'domingo': 0,
      'lunes': 1,
      'martes': 2,
      'miercoles': 3,
      'miércoles': 3,
      'jueves': 4,
      'viernes': 5,
      'sábado': 6,
      'sabado': 6
    };
    
    return dayMap[normalizedDay] ?? 1; // Default a lunes si no se encuentra
  };

  // Función para agrupar horarios por día
  const groupSchedulesByDay = (schedules) => {
    if (!Array.isArray(schedules)) {
      return [];
    }
    
    const groups = {};
    
    schedules.forEach(schedule => {
      const dayNumber = mapDayOfWeekToNumber(schedule.dayOfWeek);
      
      if (dayNumber !== undefined) {
        if (!groups[dayNumber]) {
          groups[dayNumber] = [];
        }
        groups[dayNumber].push(schedule);
      }
    });

    // Ordenar por día (0-6)
    return Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(day => ({
        day: parseInt(day),
        schedules: groups[day].sort((a, b) => 
          a.startTime.localeCompare(b.startTime)
        )
      }));
  };

  // Función para formatear hora (HH:MM:SS a HH:MM)
  const formatTime = (timeString) => {
    if (!timeString) return "00:00";
    return timeString.substring(0, 5);
  };

  // Función para formatear día de la semana
  const formatDayOfWeek = (dayNumber) => {
    const daysMap = {
      0: 'Domingo',
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado'
    };
    return daysMap[dayNumber] || `Día ${dayNumber}`;
  };

  // Función para filtrar slots disponibles cuando es hoy
  const filterTodaySlots = (slots) => {
    if (!isTodaySelected || !Array.isArray(slots) || slots.length === 0) {
      return slots;
    }
    
    const now = new Date();
    // Calcular la hora mínima para reservas hoy (15 minutos de anticipación)
    const minTime = new Date(now.getTime() + 15 * 60 * 1000);
    const currentHour = minTime.getHours();
    const currentMinute = minTime.getMinutes();
    
    // Redondear al siguiente intervalo según la granularidad
    const granularity = resourceType?.granularity || 30;
    const roundedMinutes = Math.ceil(currentMinute / granularity) * granularity;
    
    let nextHour = currentHour;
    let nextMinute = roundedMinutes;
    
    if (nextMinute >= 60) {
      nextHour += 1;
      nextMinute = 0;
    }
    
    // Formatear la hora mínima como string HH:MM
    const minTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
    
    console.log(`🕒 Hoy - Hora actual: ${now.getHours()}:${now.getMinutes()}`);
    console.log(`⏱️  Hora mínima para reserva (15 min anticipación): ${minTimeStr}`);
    console.log(`📊 Slots recibidos:`, slots);
    
    // Filtrar slots que sean iguales o posteriores a la hora mínima
    const filteredSlots = slots.filter(slot => {
      // slot puede ser un string "HH:MM" o un objeto con startTimeFormatted
      const slotTime = typeof slot === 'string' ? slot : slot.startTimeFormatted;
      return slotTime >= minTimeStr;
    });
    
    console.log(`📊 Slots originales: ${slots.length}, Slots filtrados para hoy: ${filteredSlots.length}`);
    console.log(`📋 Slots filtrados:`, filteredSlots);
    
    return filteredSlots;
  };

  // Carga de slots disponibles - MODIFICADA
  const loadAvailableSlots = async () => {
    // Verificar fecha pasada antes de hacer la llamada
    const now = new Date();
    const selected = new Date(selectedDate);
    
    // Solo comparar la parte de fecha (sin hora)
    const selectedDateOnly = new Date(selected);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // Si es una fecha pasada, no hacer la llamada
    if (selectedDateOnly < today) {
      setDateError("⚠️ No se pueden consultar fechas pasadas");
      setAvailableTimeSlots([]);
      setFilteredTimeSlots([]);
      setStartTime("");
      setEndTime("");
      return;
    }
    
    // Prevenir múltiples llamadas simultáneas
    if (isFetchingSlots.current) {
      return;
    }
    
    try {
      isFetchingSlots.current = true;
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log('🔍 Solicitando slots para fecha:', dateStr, 'Hoy:', isTodaySelected);
      
      const result = await getAvailableSlots(resource.id, dateStr);
      
      if (result && result.length > 0) {
        // Filtrar slots disponibles y formatearlos
        const availableSlotsList = result
          .filter(slot => slot.isAvailable)
          .map(slot => slot.startTimeFormatted);
        
        setAvailableTimeSlots(availableSlotsList);
        setDateError("");

        // Aplicar filtro si es hoy
        let finalSlots = availableSlotsList;
        if (isTodaySelected) {
          finalSlots = filterTodaySlots(availableSlotsList);
          setFilteredTimeSlots(finalSlots);
        } else {
          setFilteredTimeSlots(availableSlotsList);
        }

        if (finalSlots.length > 0) {
          // Seleccionar el primer slot disponible
          setStartTime(finalSlots[0]);
          
          // Intentar seleccionar el siguiente slot como hora de fin
          if (finalSlots.length > 1) {
            setEndTime(finalSlots[1]);
          } else {
            // Si solo hay un slot, usar una hora después como fallback
            const startTimeParts = finalSlots[0].split(':');
            let endHour = parseInt(startTimeParts[0]) + 1;
            if (endHour > 23) endHour = 23;
            setEndTime(`${endHour.toString().padStart(2, '0')}:${startTimeParts[1]}`);
          }
        } else {
          // No hay slots disponibles
          setStartTime("");
          setEndTime("");
          
          if (isTodaySelected) {
            setDateError("⚠️ No hay horarios disponibles para hoy en este momento");
          }
        }
      } else {
        console.warn('⚠️ No se recibieron slots del servidor');
        setAvailableTimeSlots([]);
        setFilteredTimeSlots([]);
        setStartTime("");
        setEndTime("");
      }
      
    } catch (error) {
      console.error('❌ Error cargando slots:', error);
      
      // Manejar diferentes tipos de errores
      if (error.message && error.message.includes("No se puede consultar disponibilidad en fechas pasadas")) {
        setDateError("⚠️ La fecha seleccionada ya pasó en hora Colombia");
        
        // Solo resetear si realmente es una fecha pasada
        const nowColombia = new Date(Date.now() - 5 * 60 * 60 * 1000); // UTC-5
        const selectedColombia = new Date(selectedDate.getTime() - 5 * 60 * 60 * 1000);
        
        if (selectedColombia < nowColombia) {
          const safeDate = getInitialDate();
          setSelectedDate(safeDate);
        }
      }
      
      setAvailableTimeSlots([]);
      setFilteredTimeSlots([]);
      setStartTime("");
      setEndTime("");
    } finally {
      isFetchingSlots.current = false;
    }
  };

  // FUNCIÓN PARA CALCULAR FECHAS DE REPETICIÓN
  const calculateRepeatDates = () => {
    const dates = [];
    const startDateTime = new Date(selectedDate);
    const [startHours, startMinutes] = startTime.split(':');
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const endDateTime = new Date(selectedDate);
    const [endHours, endMinutes] = endTime.split(':');
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    
    const duration = endDateTime - startDateTime;

    // Agregar la primera fecha
    dates.push({
      date: new Date(startDateTime),
      sequence: 1
    });

    let count = 1;
    let currentDate = new Date(startDateTime);
    const maxOccurrences = 52; // Límite máximo

    while (count < (repeatType === "occurrences" ? repeatOccurrences : maxOccurrences)) {
      let nextDate = new Date(currentDate);
      
      switch (repeatFrequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + repeatInterval);
          break;
        case 'weekly':
          if (selectedDays.length > 0) {
            // Encontrar el próximo día seleccionado
            let daysToAdd = 1;
            while (daysToAdd <= 7) {
              nextDate.setDate(nextDate.getDate() + 1);
              if (selectedDays.includes(nextDate.getDay())) {
                break;
              }
              daysToAdd++;
            }
          } else {
            nextDate.setDate(nextDate.getDate() + (7 * repeatInterval));
          }
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + repeatInterval);
          break;
        default:
          nextDate.setDate(nextDate.getDate() + repeatInterval);
      }

      // Verificar fecha límite
      if (repeatType === "endDate" && repeatEndDate && nextDate > repeatEndDate) {
        break;
      }

      dates.push({
        date: new Date(nextDate),
        sequence: count + 1
      });

      currentDate = new Date(nextDate);
      count++;
      
      if (count >= maxOccurrences) break;
    }

    setCalculatedDates(dates);
  };

  // Función para generar opciones de tiempo - USAR filteredTimeSlots
  const generateTimeOptions = () => {
    // Usar los slots filtrados si hay
    if (filteredTimeSlots.length > 0) {
      return filteredTimeSlots;
    }
    
    // Si no hay slots filtrados pero sí hay slots originales (cuando no es hoy)
    if (availableTimeSlots.length > 0) {
      return availableTimeSlots;
    }
    
    // Fallback: horarios predeterminados
    const defaultSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
      "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
      "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
      "20:00", "20:30"
    ];
    
    // Si es hoy, filtrar los slots predeterminados
    if (isTodaySelected) {
      return filterTodaySlots(defaultSlots);
    }
    
    return defaultSlots;
  };

  // Verificar disponibilidad
  const handleCheckAvailability = async () => {
    try {
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      // Validaciones del frontend
      if (!startTime || !endTime) {
        alert("❌ Por favor selecciona horarios válidos");
        return;
      }

      if (startDateTime >= endDateTime) {
        alert("❌ La hora de fin debe ser posterior a la hora de inicio");
        return;
      }

      // Validar que sea al menos 15 minutos en el futuro
      const now = new Date();
      const diffMinutes = Math.floor((startDateTime - now) / (1000 * 60));
      
      if (isTodaySelected && diffMinutes < 15) {
        alert(`⚠️ Las reservas deben hacerse con al menos 15 minutos de anticipación.\n\nTiempo hasta la reserva: ${diffMinutes} minutos`);
        return;
      }

      // Verificar que los horarios seleccionados estén disponibles
      const isStartTimeAvailable = filteredTimeSlots.includes(startTime);
      const isEndTimeAvailable = filteredTimeSlots.includes(endTime);

      if (!isStartTimeAvailable || !isEndTimeAvailable) {
        alert("⚠️ Los horarios seleccionados pueden no estar disponibles. Por favor verifica la disponibilidad.");
      }

      await checkAvailability(resource.id, startDateTime.toISOString(), endDateTime.toISOString());
      
    } catch (error) {
      console.error('❌ Error verificando disponibilidad:', error);
      alert("Error al verificar disponibilidad: " + error.message);
    }
  };

  // Crear reserva
  const handleCreateReservation = async () => {
    if (!purpose.trim()) {
      alert("❌ Por favor, ingresa el propósito de la reserva");
      return;
    }

    if (parseInt(attendees) < 1) {
      alert("❌ El número de asistentes debe ser al menos 1");
      return;
    }

    // Validaciones específicas para reservas repetitivas
    if (isRepetitive) {
      if (repeatFrequency === 'weekly' && selectedDays.length === 0) {
        alert("❌ Para repetición semanal debes seleccionar al menos un día de la semana");
        return;
      }

      if (repeatInterval < 1) {
        alert("❌ El intervalo debe ser al menos 1");
        return;
      }

      if (repeatType === "occurrences" && (repeatOccurrences < 2 || repeatOccurrences > 52)) {
        alert("❌ El número de ocurrencias debe estar entre 2 y 52");
        return;
      }

      if (repeatType === "endDate" && (!repeatEndDate || repeatEndDate <= selectedDate)) {
        alert("❌ La fecha final debe ser posterior a la fecha inicial");
        return;
      }
    }

    try {
      const startDateTime = new Date(selectedDate);
      const [startHours, startMinutes] = startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
      
      const endDateTime = new Date(selectedDate);
      const [endHours, endMinutes] = endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      const now = new Date();
      
      // Validaciones finales
      if (!startTime || !endTime) {
        alert("❌ Por favor selecciona horarios válidos");
        return;
      }

      if (startDateTime >= endDateTime) {
        alert("❌ La hora de fin debe ser posterior a la hora de inicio");
        return;
      }

      // Validar margen mínimo de 15 minutos si es hoy
      if (isTodaySelected) {
        const diffMinutes = Math.floor((startDateTime - now) / (1000 * 60));
        if (diffMinutes < 15) {
          alert(`⚠️ Las reservas deben hacerse con al menos 15 minutos de anticipación.\n\nTiempo hasta la reserva: ${diffMinutes} minutos`);
          return;
        }
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
        isRepetitive: isRepetitive
      };

      // Agregar configuración de repetición si es repetitiva
      if (isRepetitive) {
        const repeatConfig = {
          frequency: repeatFrequency,
          interval: repeatInterval
        };

        if (repeatFrequency === 'weekly' && selectedDays.length > 0) {
          repeatConfig.daysOfWeek = selectedDays;
        }

        if (repeatType === "occurrences") {
          repeatConfig.occurrences = repeatOccurrences;
        } else if (repeatType === "endDate" && repeatEndDate) {
          repeatConfig.endDate = repeatEndDate.toISOString().split('T')[0];
        }

        reservationData.repeatConfig = repeatConfig;
      }

      await onCreateReservation(reservationData);

    } catch (error) {
      console.error('❌ Error creando reserva:', error);
      alert("Error al crear la reserva: " + error.message);
    }
  };

  // Cambiar fecha - CORREGIDA
  const handleDateChange = (date) => {
    if (!date) return;
    
    const now = new Date();
    
    // Solo comparar la parte de fecha (sin hora)
    const selectedDateOnly = new Date(date);
    selectedDateOnly.setHours(0, 0, 0, 0);
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    // SOLO bloquear si es un día anterior, NO si es hoy
    if (selectedDateOnly < today) {
      alert("❌ No se pueden seleccionar fechas pasadas. Por favor selecciona hoy o una fecha futura.");
      return;
    }
    
    setSelectedDate(date);
    // Limpiar selecciones de tiempo al cambiar fecha
    setStartTime("");
    setEndTime("");
    setDateError("");
    setFilteredTimeSlots([]);
    setFilteredAvailableSlots([]);
  };

  // Seleccionar días para repetición semanal
  const handleDaySelection = (dayIndex) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  // Usar filteredTimeSlots para las opciones
  const timeOptions = generateTimeOptions();
  const isFormValid = purpose.trim() && startTime && endTime && parseInt(attendees) >= 1;
  
  // Validación adicional para repetitivas
  const isRepeatValid = !isRepetitive || (
    (repeatFrequency !== 'weekly' || selectedDays.length > 0) &&
    repeatInterval >= 1 &&
    (repeatType !== "occurrences" || (repeatOccurrences >= 2 && repeatOccurrences <= 52)) &&
    (repeatType !== "endDate" || (repeatEndDate && repeatEndDate > selectedDate))
  );

  // Formatear fecha para mostrar
  const formattedDate = selectedDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Días de la semana (0-6)
  const daysOfWeek = [
    { index: 0, label: 'Domingo', short: 'D' },
    { index: 1, label: 'Lunes', short: 'L' },
    { index: 2, label: 'Martes', short: 'M' },
    { index: 3, label: 'Miércoles', short: 'X' },
    { index: 4, label: 'Jueves', short: 'J' },
    { index: 5, label: 'Viernes', short: 'V' },
    { index: 6, label: 'Sábado', short: 'S' }
  ];

  // Obtener horarios agrupados por día
  const groupedSchedules = groupSchedulesByDay(typeSchedules);
  
  // Obtener día de la semana seleccionado (0-6)
  const selectedDayOfWeek = selectedDate.getDay();
  
  // Filtrar horarios para el día seleccionado
  const schedulesForSelectedDay = groupedSchedules.find(group => group.day === selectedDayOfWeek)?.schedules || [];

  // Calcular si hay horarios disponibles para el día seleccionado
  const hasSchedulesForSelectedDay = schedulesForSelectedDay.length > 0;

  // Calcular slots disponibles para mostrar en el contador
  const slotsToShowCount = filteredTimeSlots.length > 0 ? filteredTimeSlots.length : 
                         (availableTimeSlots.length > 0 ? availableTimeSlots.length : 0);

  return (
    <div className="reservation-calendar">
      <div className="calendar-header">
        <h2>Reservar {resource.name}</h2>
        <p className="resource-path">{unit?.name} - {resourceType?.name}</p>
        <div className="resource-details">
          <span className="granularity-info">
            ⚙️ Granularidad: {resourceType?.granularity || 30} minutos
          </span>
          <span className="timezone-info">
            🌍 Zona horaria: Colombia (UTC-5)
          </span>
          {isTodaySelected && (
            <span className="today-restriction">
              ⏰ Hoy: slots desde hora actual + 15 min
            </span>
          )}
        </div>
      </div>

      <div className="calendar-content">
        {/* Mostrar horarios del tipo de recurso */}
        <div className="type-schedules-card">
          <div className="type-schedules-header">
            <h4>📋 Horarios del Tipo de Recurso</h4>
            {loadingSchedules ? (
              <span className="loading-text">Cargando...</span>
            ) : typeScheduleError ? (
              <span className="error-text-small">⚠️ {typeScheduleError}</span>
            ) : (
              <button 
                onClick={loadTypeSchedules}
                className="btn-refresh"
                title="Actualizar horarios"
              >
                🔄
              </button>
            )}
          </div>
          
          {loadingSchedules ? (
            <div className="loading-schedules">
              <div className="loading-spinner-small"></div>
              <span>Cargando horarios...</span>
            </div>
          ) : groupedSchedules.length > 0 ? (
            <div className="type-schedules-list">
              {groupedSchedules.map((group) => (
                <div key={group.day} className="schedule-day-group">
                  <div className={`schedule-day-header ${group.day === selectedDayOfWeek ? 'selected-day' : ''}`}>
                    <span className="day-name">{formatDayOfWeek(group.day)}</span>
                    {group.day === selectedDayOfWeek && (
                      <>
                        {hasSchedulesForSelectedDay ? (
                          <span className="available-indicator"> ✅ Disponible</span>
                        ) : (
                          <span className="unavailable-indicator"> ❌ No disponible</span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="day-schedules">
                    {group.schedules.map((schedule, index) => {
                      const startTimeStr = formatTime(schedule.startTime);
                      const endTimeStr = formatTime(schedule.endTime);
                      const isAvailableForDay = group.day === selectedDayOfWeek;
                      
                      return (
                        <div 
                          key={index} 
                          className={`schedule-time-item ${isAvailableForDay ? 'available-today' : ''}`}
                          title={`${startTimeStr} - ${endTimeStr} ${isAvailableForDay ? '(Disponible hoy)' : ''}`}
                        >
                          <span className="schedule-time">{startTimeStr} - {endTimeStr}</span>
                          {isAvailableForDay && <span className="today-badge">Hoy</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : typeScheduleError ? (
            <div className="schedules-error">
              <span className="error-text">{typeScheduleError}</span>
            </div>
          ) : (
            <div className="no-schedules">
              <span className="warning-text">⚠️ No hay horarios definidos para este tipo de recurso</span>
            </div>
          )}
          
          {/* Mostrar horarios específicos para el día seleccionado */}
          {hasSchedulesForSelectedDay && (
            <div className="selected-day-schedules">
              <h5>⏰ Horarios para {formatDayOfWeek(selectedDayOfWeek)}:</h5>
              <div className="selected-day-slots">
                {schedulesForSelectedDay.map((schedule, index) => {
                  const startTimeStr = formatTime(schedule.startTime);
                  const endTimeStr = formatTime(schedule.endTime);
                  
                  return (
                    <div key={index} className="selected-day-slot">
                      <span className="slot-time">{startTimeStr} - {endTimeStr}</span>
                      {(filteredTimeSlots.includes(startTimeStr) || availableTimeSlots.includes(startTimeStr)) ? (
                        <span className="slot-status available">✅ Disponible</span>
                      ) : (
                        <span className="slot-status unavailable">❌ Ocupado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

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
                {slotsToShowCount > 0 ? (
                  `📊 ${slotsToShowCount} horarios disponibles ${isTodaySelected ? '(filtrados para hoy)' : ''}`
                ) : dateError ? (
                  <span className="error-text">{dateError}</span>
                ) : (
                  <span className="warning-text">⚠️ No hay horarios disponibles</span>
                )}
              </span>
              <span className="selected-date">
                {formattedDate} {isTodaySelected && ' (Hoy - slots filtrados)'}
              </span>
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
            minDate={new Date()} // Permite hoy
            locale={es}
            dateFormat="dd/MM/yyyy"
            className="date-picker"
            placeholderText="Selecciona una fecha"
            filterDate={(date) => {
              // Solo bloquear días anteriores, NO hoy
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const selected = new Date(date);
              selected.setHours(0, 0, 0, 0);
              return selected >= today;
            }}
          />
          <small className="date-hint">
            {isTodaySelected ? (
              "✅ Hoy - slots desde hora actual + 15 min de anticipación"
            ) : (
              "Solo se pueden seleccionar hoy o fechas futuras"
            )}
          </small>
          {dateError && (
            <small className="error-text">{dateError}</small>
          )}
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
              disabled={loadingSlots || dateError || slotsToShowCount === 0}
            >
              <option value="" disabled>
                {loadingSlots ? 'Cargando...' : 
                 dateError ? 'Fecha rechazada' : 
                 slotsToShowCount === 0 ? 'No hay slots disponibles' : 'Selecciona hora'}
              </option>
              {timeOptions.length > 0 && timeOptions.map(slot => (
                <option 
                  key={`start-${slot}`} 
                  value={slot}
                >
                  {slot} {(filteredTimeSlots.includes(slot) || availableTimeSlots.includes(slot)) ? '✅' : '❌'}
                </option>
              ))}
            </select>
            {loadingSlots && <small className="loading-text">Cargando horarios...</small>}
            {dateError && <small className="error-text">Selecciona otra fecha</small>}
          </div>

          <div className="form-group">
            <label htmlFor="end-time">🕒 Hora de fin:</label>
            <select 
              id="end-time"
              value={endTime} 
              onChange={(e) => setEndTime(e.target.value)}
              className="time-select"
              disabled={loadingSlots || dateError || slotsToShowCount === 0}
            >
              <option value="" disabled>
                {loadingSlots ? 'Cargando...' : 
                 dateError ? 'Fecha rechazada' : 
                 slotsToShowCount === 0 ? 'No hay slots disponibles' : 'Selecciona hora'}
              </option>
              {timeOptions.length > 0 && timeOptions.map(slot => (
                <option 
                  key={`end-${slot}`} 
                  value={slot}
                >
                  {slot} {(filteredTimeSlots.includes(slot) || availableTimeSlots.includes(slot)) ? '✅' : '❌'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Previsualización de slots del día - USAR filteredAvailableSlots */}
        {filteredAvailableSlots && filteredAvailableSlots.length > 0 && !dateError && (
          <div className="available-slots-preview">
            <h4>📋 Horarios del día (disponibilidad):</h4>
            <div className="slots-grid">
              {filteredAvailableSlots.slice(0, 8).map((slot, index) => (
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
            {filteredAvailableSlots.length > 8 && (
              <small className="more-slots">
                ... y {filteredAvailableSlots.length - 8} horarios más
              </small>
            )}
          </div>
        )}

        {/* Resto del componente se mantiene igual... */}
        {/* Configuración de repetición */}
        <div className="repeat-section">
          <div className="repeat-toggle">
            <label>
              <input
                type="checkbox"
                checked={isRepetitive}
                onChange={(e) => setIsRepetitive(e.target.checked)}
                disabled={dateError}
              />
              <span className="repeat-label">🔄 Crear reserva repetitiva</span>
            </label>
            {dateError && <small className="error-text">(No disponible)</small>}
          </div>

          {isRepetitive && !dateError && (
            <div className="repeat-configuration">
              <div className="repeat-fields">
                <div className="form-group">
                  <label>Frecuencia:</label>
                  <select 
                    value={repeatFrequency} 
                    onChange={(e) => setRepeatFrequency(e.target.value)}
                    className="repeat-select"
                  >
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Intervalo:</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                    className="interval-input"
                  />
                  <span className="interval-label">
                    {repeatFrequency === 'daily' ? 'día(s)' : 
                     repeatFrequency === 'weekly' ? 'semana(s)' : 'mes(es)'}
                  </span>
                </div>
              </div>

              {/* Días de la semana para frecuencia semanal */}
              {repeatFrequency === 'weekly' && (
                <div className="weekdays-selection">
                  <label>Días de la semana:</label>
                  <div className="weekdays-grid">
                    {daysOfWeek.map(day => (
                      <button
                        key={day.index}
                        type="button"
                        className={`day-button ${selectedDays.includes(day.index) ? 'selected' : ''}`}
                        onClick={() => handleDaySelection(day.index)}
                        title={day.label}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo de repetición */}
              <div className="repeat-type">
                <label>
                  <input
                    type="radio"
                    name="repeatType"
                    value="occurrences"
                    checked={repeatType === "occurrences"}
                    onChange={(e) => setRepeatType(e.target.value)}
                  />
                  <span>Número de ocurrencias:</span>
                </label>
                {repeatType === "occurrences" && (
                  <input
                    type="number"
                    min="2"
                    max="52"
                    value={repeatOccurrences}
                    onChange={(e) => setRepeatOccurrences(parseInt(e.target.value) || 2)}
                    className="occurrences-input"
                  />
                )}

                <label className="repeat-type-option">
                  <input
                    type="radio"
                    name="repeatType"
                    value="endDate"
                    checked={repeatType === "endDate"}
                    onChange={(e) => setRepeatType(e.target.value)}
                  />
                  <span>Hasta fecha:</span>
                </label>
                {repeatType === "endDate" && (
                  <DatePicker
                    selected={repeatEndDate}
                    onChange={setRepeatEndDate}
                    minDate={selectedDate}
                    locale={es}
                    dateFormat="dd/MM/yyyy"
                    className="end-date-picker"
                    placeholderText="Selecciona fecha final"
                  />
                )}
              </div>

              {/* Vista previa de fechas */}
              {calculatedDates.length > 0 && (
                <div className="dates-preview">
                  <h5>📅 Fechas de la reserva ({calculatedDates.length} ocurrencias):</h5>
                  <div className="dates-list">
                    {calculatedDates.slice(0, 5).map((item, index) => (
                      <div key={index} className="date-item">
                        <span className="date-sequence">{item.sequence}.</span>
                        <span className="date-value">
                          {item.date.toLocaleDateString('es-ES', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </span>
                        <span className="date-time">
                          {startTime} - {endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                  {calculatedDates.length > 5 && (
                    <small className="more-dates">
                      ... y {calculatedDates.length - 5} fechas más
                    </small>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalles de la reserva */}
        <div className="form-group">
          <label htmlFor="purpose">📝 Propósito de la reserva:</label>
          <textarea
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe el propósito de esta reserva..."
            rows="3"
            className="purpose-textarea"
            disabled={dateError}
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
            disabled={dateError}
          />
        </div>

        {/* Verificación de disponibilidad */}
        <div className="availability-section">
          <button 
            onClick={handleCheckAvailability}
            disabled={checkingAvailability || !startTime || !endTime || dateError || slotsToShowCount === 0}
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
                  {isRepetitive && calculatedDates.length > 1 && (
                    <div className="repeat-availability-note">
                      (Se crearán {calculatedDates.length} reservas)
                    </div>
                  )}
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
            disabled={!isFormValid || checkingAvailability || (availabilityResult && !availabilityResult.isAvailable) || !isRepeatValid || dateError}
            className="btn-confirm-reservation"
            title={
              dateError ? "Fecha rechazada por el servidor" :
              !isFormValid ? "Completa todos los campos requeridos" :
              ""
            }
          >
            {checkingAvailability ? (
              <>
                <div className="reserve-spinner"></div>
                Creando...
              </>
            ) : isRepetitive ? (
              `✅ Confirmar ${calculatedDates.length} Reservas`
            ) : (
              '✅ Confirmar Reserva'
            )}
          </button>
        </div>

        {/* Información de ayuda */}
        <div className="help-info">
          <h4>💡 Información importante:</h4>
          <ul>
            <li><strong>Horarios del tipo de recurso</strong> definen las franjas permitidas</li>
            <li>Los horarios marcados con <strong>✅ están disponibles</strong> para reserva</li>
            <li>Se pueden seleccionar <strong>HOY y fechas futuras</strong></li>
            <li>Las reservas requieren al menos <strong>15 minutos de anticipación</strong></li>
            <li>Activa "Crear reserva repetitiva" para programar múltiples fechas</li>
            <li>Verifica la disponibilidad antes de confirmar</li>
            <li><strong>HOY:</strong> solo se muestran slots desde la hora actual + 15 minutos</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReservationCalendar;