const API_URL = "http://localhost:3001/api/reservations";

// Create reservation
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

// Get my reservations
export const getMyReservationsApi = async (filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { status, page = 1, limit = 10, startDate, endDate } = filters;
  
  let url = `${API_URL}/my-reservations?page=${page}&limit=${limit}`;
  
  if (status && status !== 'all') {
    url += `&status=${status}`;
  }
  
  if (startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
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

// Cancel reservation
export const cancelReservationApi = async (reservationId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${reservationId}/cancel`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al cancelar reserva");
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

// Get all reservations (admin/employee)
export const getAllReservationsApi = async (filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { status, resourceId, userId, startDate, endDate, page = 1, limit = 10 } = filters;
  
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

// Validar datos de reserva antes de enviar
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

  return errors;
};

export default {
  // Reservas básicas
  createReservationApi,
  getMyReservationsApi,
  getReservationApi,
  cancelReservationApi,
  
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
  validateReservationData
};