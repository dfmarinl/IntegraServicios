const API_URL = "http://localhost:3001/api/reservations";

// ========== FUNCIONES EXISTENTES MANTENIDAS ==========

// Create reservation (ahora soporta repetitivas)
export const createReservationApi = async (reservationData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reservationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear reserva");
  }

  return await response.json();
};

// Get my reservations (ahora soporta filtro por repetitivas)
export const getMyReservationsApi = async (filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { status, page = 1, limit = 10, startDate, endDate, isRepetitive } = filters;
  
  let url = `${API_URL}/my-reservations?page=${page}&limit=${limit}`;
  
  if (status && status !== 'all') {
    url += `&status=${status}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  if (isRepetitive !== undefined) {
    url += `&isRepetitive=${isRepetitive}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener mis reservas");
  }

  return await response.json();
};

// Get specific reservation
export const getReservationApi = async (reservationId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${reservationId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener reserva");
  }

  return await response.json();
};

// Cancel reservation (actualizada para soportar cancelAll y cancelFuture)
// Cancel reservation (actualizada para manejar body vacío)
export const cancelReservationApi = async (reservationId, cancelAll = false, cancelFuture = false) => {
  const token = localStorage.getItem("token");

  // Crear body solo si es necesario
  let body = null;
  if (cancelAll || cancelFuture) {
    body = JSON.stringify({ 
      cancelAll, 
      cancelFuture 
    });
  }

  const config = {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Solo agregar body si existe
  if (body) {
    config.body = body;
  }

  const response = await fetch(`${API_URL}/${reservationId}/cancel`, config);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al cancelar reserva");
  }

  return await response.json();
};
// ========== FUNCIONES NUEVAS PARA RESERVAS REPETITIVAS ==========

// Verificar disponibilidad para reserva repetitiva
export const checkRepeatAvailabilityApi = async (resourceId, startDateTime, endDateTime, repeatConfig) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/check-repeat-availability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resourceId,
      startDateTime,
      endDateTime,
      repeatConfig
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al verificar disponibilidad repetitiva");
  }

  return await response.json();
};

// Obtener mis series de reservas repetitivas
export const getMyRepeatSeriesApi = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/repeat-series/my`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener series repetitivas");
  }

  return await response.json();
};

// Obtener todas las series repetitivas (admin/empleados)
export const getAllRepeatSeriesApi = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/repeat-series/all`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener todas las series repetitivas");
  }

  return await response.json();
};

// ========== FUNCIONES PARA CALENDARIO Y DISPONIBILIDAD ==========

// Get available time slots for a resource on specific date
export const getAvailableSlotsApi = async (resourceId, date) => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_URL}/resource/${resourceId}/availability?date=${date}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener horarios disponibles");
  }

  return await response.json();
};

// Get availability for a date range
export const getAvailabilityRangeApi = async (resourceId, startDate, endDate) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/resource/${resourceId}/availability-range?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener disponibilidad en rango");
  }

  return await response.json();
};

// Check resource availability for specific datetime
export const checkResourceAvailabilityApi = async (resourceId, startDateTime, endDateTime) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/check-availability`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      resourceId,
      startDateTime,
      endDateTime
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al verificar disponibilidad");
  }

  return await response.json();
};

// ========== FUNCIONES PARA ADMIN/EMPLEADO ==========

// Get all reservations (admin/employee) - ahora con filtro por repetitivas
export const getAllReservationsApi = async (filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { status, resourceId, userId, startDate, endDate, page = 1, limit = 10, isRepetitive } = filters;
  
  let url = `${API_URL}?page=${page}&limit=${limit}`;
  
  if (status && status !== 'all') {
    url += `&status=${status}`;
  }
  
  if (resourceId) {
    url += `&resourceId=${resourceId}`;
  }
  
  if (userId) {
    url += `&userId=${userId}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }

  if (isRepetitive !== undefined) {
    url += `&isRepetitive=${isRepetitive}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener todas las reservas");
  }

  return await response.json();
};

// Update reservation status (admin/employee)
export const updateReservationStatusApi = async (reservationId, status) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${reservationId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar estado de reserva");
  }

  return await response.json();
};

// Get reservations by resource
export const getResourceReservationsApi = async (resourceId, filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { startDate, endDate } = filters;
  
  let url = `${API_URL}/resource/${resourceId}`;
  
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener reservas del recurso");
  }

  return await response.json();
};

// Get reservations by user
export const getUserReservationsApi = async (userId, filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { status, startDate, endDate } = filters;
  
  let url = `${API_URL}/user/${userId}`;
  
  const params = new URLSearchParams();
  
  if (status && status !== 'all') {
    params.append('status', status);
  }
  
  if (startDate && endDate) {
    params.append('startDate', startDate);
    params.append('endDate', endDate);
  }
  
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener reservas del usuario");
  }

  return await response.json();
};

// ========== FUNCIONES DE UTILIDAD ==========

// Formatear fecha para APIs
export const formatDateForAPI = (date) => {
  return date.toISOString().split('T')[0];
};

// Formatear datetime para APIs
export const formatDateTimeForAPI = (date) => {
  return date.toISOString();
};

// Validar si una fecha está en el pasado
export const isDateInPast = (date) => {
  return new Date(date) < new Date();
};

// Calcular duración en horas entre dos fechas
export const calculateDuration = (startDateTime, endDateTime) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  const durationMs = end - start;
  return durationMs / (1000 * 60 * 60); // Retorna horas
};

// Función para calcular fechas de repetición (para uso en frontend)
export const calculateRepeatDatesFrontend = (startDateTime, endDateTime, repeatConfig) => {
  const {
    frequency,
    interval = 1,
    occurrences,
    endDate: repeatEndDate,
    daysOfWeek = []
  } = repeatConfig;

  const dates = [];
  const startDate = new Date(startDateTime);
  const originalEnd = new Date(endDateTime);
  const duration = originalEnd - startDate;

  dates.push({
    startDateTime: new Date(startDate),
    endDateTime: new Date(originalEnd),
    sequence: 1
  });

  let currentDate = new Date(startDate);
  const endCondition = repeatEndDate ? new Date(repeatEndDate) : null;
  let count = 1;
  let sequence = 2;

  while (true) {
    if (occurrences && count >= occurrences) break;
    if (endCondition && currentDate > endCondition) break;

    let nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        if (daysOfWeek.length > 0) {
          let daysToAdd = 1;
          while (daysToAdd <= 7) {
            nextDate.setDate(nextDate.getDate() + 1);
            if (daysOfWeek.includes(nextDate.getDay())) {
              break;
            }
            daysToAdd++;
          }
        } else {
          nextDate.setDate(nextDate.getDate() + (7 * interval));
        }
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + interval);
    }

    if (endCondition && nextDate > endCondition) break;
    
    const newStart = new Date(nextDate);
    const newEnd = new Date(newStart.getTime() + duration);

    dates.push({
      startDateTime: newStart,
      endDateTime: newEnd,
      sequence: sequence
    });

    currentDate = new Date(nextDate);
    count++;
    sequence++;
    
    if (count > 365) break;
  }

  return dates;
};

// Validar datos de reserva antes de enviar (actualizada para repetitivas)
export const validateReservationData = (reservationData) => {
  const errors = [];

  if (!reservationData.resourceId) {
    errors.push("El ID del recurso es requerido");
  }

  if (!reservationData.startDateTime) {
    errors.push("La fecha y hora de inicio es requerida");
  }

  if (!reservationData.endDateTime) {
    errors.push("La fecha y hora de fin es requerida");
  }

  if (!reservationData.purpose?.trim()) {
    errors.push("El propósito de la reserva es requerido");
  }

  if (reservationData.attendees && reservationData.attendees < 1) {
    errors.push("El número de asistentes debe ser al menos 1");
  }

  const startDate = new Date(reservationData.startDateTime);
  const endDate = new Date(reservationData.endDateTime);

  if (startDate >= endDate) {
    errors.push("La fecha de inicio debe ser anterior a la fecha de fin");
  }

  if (startDate < new Date()) {
    errors.push("No se pueden crear reservas en el pasado");
  }

  // Validaciones específicas para reservas repetitivas
  if (reservationData.isRepetitive) {
    if (!reservationData.repeatConfig) {
      errors.push("La configuración de repetición es requerida para reservas repetitivas");
    } else {
      const { frequency, interval = 1, occurrences, endDate: repeatEndDate, daysOfWeek } = reservationData.repeatConfig;
      
      if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
        errors.push("Frecuencia inválida. Use: daily, weekly o monthly");
      }

      if (!occurrences && !repeatEndDate) {
        errors.push("Especifique 'occurrences' o 'endDate' para repeticiones");
      }

      if (frequency === 'weekly' && (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
        errors.push("Para repetición semanal especifique daysOfWeek [0-6]");
      }

      if (interval < 1) {
        errors.push("El intervalo debe ser al menos 1");
      }

      if (occurrences && (occurrences < 2 || occurrences > 52)) {
        errors.push("El número de ocurrencias debe estar entre 2 y 52");
      }
    }
  }

  return errors;
};

// Función helper para mostrar opciones de cancelación de repetitivas
export const getRepeatCancelOptions = (reservation) => {
  if (!reservation.isRepetitive) return null;
  
  return {
    title: 'Cancelar reserva repetitiva',
    message: 'Esta es una reserva repetitiva. ¿Qué desea cancelar?',
    options: [
      { value: 'single', label: 'Solo esta reserva' },
      { value: 'future', label: 'Repeticiones futuras' },
      { value: 'all', label: 'Todas las repeticiones' }
    ]
  };
};

export default {
  // Reservas básicas
  createReservationApi,
  getMyReservationsApi,
  getReservationApi,
  cancelReservationApi,
  
  // Nuevas funciones para reservas repetitivas
  checkRepeatAvailabilityApi,
  getMyRepeatSeriesApi,
  getAllRepeatSeriesApi,
  
  // Calendario y disponibilidad
  getAvailableSlotsApi,
  getAvailabilityRangeApi,
  checkResourceAvailabilityApi,
  
  // Admin/empleado
  getAllReservationsApi,
  updateReservationStatusApi,
  getResourceReservationsApi,
  getUserReservationsApi,
  
  // Utilidades
  formatDateForAPI,
  formatDateTimeForAPI,
  isDateInPast,
  calculateDuration,
  calculateRepeatDatesFrontend,
  validateReservationData,
  getRepeatCancelOptions
};