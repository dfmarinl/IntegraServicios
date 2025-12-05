const API_URL = "http://localhost:3001/api/admin/reservations";

// ========== FUNCIONES DE DASHBOARD Y ESTADÍSTICAS ==========

// Obtener dashboard de reservas
export const getReservationDashboardApi = async (filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { startDate, endDate, unitId } = filters;
  
  let url = `${API_URL}/dashboard`;
  
  const params = new URLSearchParams();
  
  if (startDate) {
    params.append('startDate', startDate);
  }
  
  if (endDate) {
    params.append('endDate', endDate);
  }
  
  if (unitId) {
    params.append('unitId', unitId);
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
    throw new Error(error.message || "Error al obtener dashboard de reservas");
  }

  return await response.json();
};

// ========== FUNCIONES DE GESTIÓN COMPLETA DE RESERVAS ==========

// Obtener todas las reservas con detalles completos
export const getAllReservationsWithDetailsApi = async (filters = {}) => {
  const token = localStorage.getItem("token");
  
  const { 
    status, 
    resourceId, 
    userId, 
    unitId, 
    startDate, 
    endDate, 
    isRepetitive,
    page = 1, 
    limit = 20,
    sortBy = 'startDateTime',
    sortOrder = 'DESC'
  } = filters;
  
  let url = `${API_URL}/all-detailed`;
  
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);
  
  if (status && status !== 'all') {
    params.append('status', status);
  }
  
  if (resourceId) {
    params.append('resourceId', resourceId);
  }
  
  if (userId) {
    params.append('userId', userId);
  }
  
  if (unitId) {
    params.append('unitId', unitId);
  }
  
  if (isRepetitive !== undefined) {
    params.append('isRepetitive', isRepetitive);
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
    throw new Error(error.message || "Error al obtener reservas detalladas");
  }

  return await response.json();
};

// Obtener detalles completos de una reserva específica
export const getReservationDetailsApi = async (reservationId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${reservationId}/details`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener detalles de la reserva");
  }

  return await response.json();
};

// Actualizar reserva (edición completa)
export const updateReservationApi = async (reservationId, updates) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${reservationId}/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar reserva");
  }

  return await response.json();
};

// Eliminar reserva (con justificación)
export const deleteReservationApi = async (reservationId, reason) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${reservationId}/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar reserva");
  }

  return await response.json();
};

// ========== FUNCIONES PARA SERIES REPETITIVAS (ADMIN) ==========

// Gestionar series de reservas repetitivas
export const manageRepeatSeriesApi = async (seriesId, action, config = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/repeat-series/${seriesId}/manage`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      action,
      ...config
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al gestionar serie repetitiva");
  }

  return await response.json();
};

// ========== FUNCIONES DE BÚSQUEDA AVANZADA ==========

// Búsqueda avanzada de reservas
export const searchReservationsApi = async (searchCriteria = {}) => {
  const token = localStorage.getItem("token");
  
  const {
    query,
    resourceTypeId,
    unitId,
    minAttendees,
    maxAttendees,
    hasLoan,
    hasRating,
    startDate,
    endDate
  } = searchCriteria;
  
  let url = `${API_URL}/search/advanced`;
  
  const params = new URLSearchParams();
  
  if (query) {
    params.append('query', query);
  }
  
  if (resourceTypeId) {
    params.append('resourceTypeId', resourceTypeId);
  }
  
  if (unitId) {
    params.append('unitId', unitId);
  }
  
  if (minAttendees) {
    params.append('minAttendees', minAttendees);
  }
  
  if (maxAttendees) {
    params.append('maxAttendees', maxAttendees);
  }
  
  if (hasLoan !== undefined) {
    params.append('hasLoan', hasLoan);
  }
  
  if (hasRating !== undefined) {
    params.append('hasRating', hasRating);
  }
  
  if (startDate) {
    params.append('startDate', startDate);
  }
  
  if (endDate) {
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
    throw new Error(error.message || "Error en búsqueda avanzada");
  }

  return await response.json();
};

// ========== FUNCIONES DE REPORTES Y ESTADÍSTICAS ==========

// Generar reportes de reservas
export const generateReservationsReportApi = async (reportConfig = {}) => {
  const token = localStorage.getItem("token");
  
  const { 
    startDate, 
    endDate, 
    format = 'json',
    unitId,
    resourceTypeId 
  } = reportConfig;
  
  let url = `${API_URL}/reports/generate`;
  
  const params = new URLSearchParams();
  
  if (startDate) {
    params.append('startDate', startDate);
  }
  
  if (endDate) {
    params.append('endDate', endDate);
  }
  
  params.append('format', format);
  
  if (unitId) {
    params.append('unitId', unitId);
  }
  
  if (resourceTypeId) {
    params.append('resourceTypeId', resourceTypeId);
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
    throw new Error(error.message || "Error al generar reporte");
  }

  // Manejar diferentes formatos de respuesta
  if (format === 'csv') {
    return await response.text();
  }
  
  if (format === 'pdf') {
    return await response.blob();
  }
  
  return await response.json();
};

// ========== FUNCIONES DE OPERACIONES MASIVAS ==========

// Actualización masiva de reservas
export const bulkUpdateReservationsApi = async (reservationIds, updates) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/bulk/update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      reservationIds,
      updates
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error en actualización masiva");
  }

  return await response.json();
};

// ========== FUNCIONES DE UTILIDAD PARA ADMIN ==========

// Formatear fechas para reportes
export const formatDateRangeForReport = (startDate, endDate) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const start = new Date(startDate).toLocaleDateString('es-ES', options);
  const end = new Date(endDate).toLocaleDateString('es-ES', options);
  return `${start} - ${end}`;
};

// Validar filtros de búsqueda
export const validateSearchFilters = (filters) => {
  const errors = [];
  
  if (filters.startDate && filters.endDate) {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    
    if (start > end) {
      errors.push("La fecha de inicio debe ser anterior a la fecha de fin");
    }
    
    // No permitir rangos mayores a 1 año
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if ((end - start) > oneYearMs) {
      errors.push("El rango de fechas no puede ser mayor a 1 año");
    }
  }
  
  if (filters.minAttendees && filters.maxAttendees) {
    if (parseInt(filters.minAttendees) > parseInt(filters.maxAttendees)) {
      errors.push("El mínimo de asistentes no puede ser mayor al máximo");
    }
  }
  
  return errors;
};

// Preparar datos para CSV
export const prepareReservationsForCSV = (reservations) => {
  const headers = [
    'ID',
    'Fecha Inicio',
    'Fecha Fin',
    'Estado',
    'Propósito',
    'Asistentes',
    'Recurso',
    'Tipo Recurso',
    'Unidad',
    'Usuario',
    'Email Usuario',
    'Rol Usuario'
  ];
  
  const rows = reservations.map(reservation => [
    reservation.id,
    new Date(reservation.startDateTime).toLocaleString('es-ES'),
    new Date(reservation.endDateTime).toLocaleString('es-ES'),
    reservation.status,
    reservation.purpose,
    reservation.attendees,
    reservation.Resource?.name || 'N/A',
    reservation.Resource?.ResourceType?.name || 'N/A',
    reservation.Resource?.ResourceType?.Unit?.name || 'N/A',
    `${reservation.User?.firstName || ''} ${reservation.User?.lastName || ''}`.trim(),
    reservation.User?.email || 'N/A',
    reservation.User?.rol || 'N/A'
  ]);
  
  return [headers, ...rows];
};

// Calcular estadísticas rápidas
export const calculateQuickStats = (reservations) => {
  const stats = {
    total: reservations.length,
    byStatus: {},
    byResourceType: {},
    byUnit: {},
    totalAttendees: 0,
    repetitiveCount: 0,
    averageDuration: 0
  };
  
  let totalDuration = 0;
  
  reservations.forEach(reservation => {
    // Por estado
    stats.byStatus[reservation.status] = (stats.byStatus[reservation.status] || 0) + 1;
    
    // Por tipo de recurso
    const resourceType = reservation.Resource?.ResourceType?.name || 'Desconocido';
    stats.byResourceType[resourceType] = (stats.byResourceType[resourceType] || 0) + 1;
    
    // Por unidad
    const unit = reservation.Resource?.ResourceType?.Unit?.name || 'Desconocida';
    stats.byUnit[unit] = (stats.byUnit[unit] || 0) + 1;
    
    // Asistentes
    stats.totalAttendees += reservation.attendees || 1;
    
    // Repetitivas
    if (reservation.isRepetitive) {
      stats.repetitiveCount++;
    }
    
    // Duración
    const start = new Date(reservation.startDateTime);
    const end = new Date(reservation.endDateTime);
    const durationHours = (end - start) / (1000 * 60 * 60);
    totalDuration += durationHours;
  });
  
  stats.averageDuration = stats.total > 0 ? (totalDuration / stats.total).toFixed(2) : 0;
  
  return stats;
};

// Generar nombre de archivo para exportación
export const generateExportFilename = (prefix = 'reservations', format = 'csv') => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${dateStr}_${timeStr}.${format}`;
};

// Descargar archivo
export const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ========== EXPORT DEFAULT ==========

export default {
  // Dashboard y estadísticas
  getReservationDashboardApi,
  
  // Gestión completa
  getAllReservationsWithDetailsApi,
  getReservationDetailsApi,
  updateReservationApi,
  deleteReservationApi,
  
  // Series repetitivas
  manageRepeatSeriesApi,
  
  // Búsqueda avanzada
  searchReservationsApi,
  
  // Reportes
  generateReservationsReportApi,
  
  // Operaciones masivas
  bulkUpdateReservationsApi,
  
  // Utilidades
  formatDateRangeForReport,
  validateSearchFilters,
  prepareReservationsForCSV,
  calculateQuickStats,
  generateExportFilename,
  downloadFile
};