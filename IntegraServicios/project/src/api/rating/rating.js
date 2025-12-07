const API_URL = "http://localhost:3001/api/ratings";

// Crear calificación
export const createRatingApi = async (ratingData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ratingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear calificación");
  }

  return await response.json();
};

// Obtener todas las calificaciones
export const getRatingsApi = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener calificaciones");
  }

  return await response.json();
};

// Obtener calificaciones paginadas
export const getRatingsPaginatedApi = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  const token = localStorage.getItem("token");

  // Construir query string con filtros
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const response = await fetch(`${API_URL}/paginated?${queryParams}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener calificaciones paginadas"
    );
  }

  return await response.json();
};

// Obtener una calificación específica
export const getRatingApi = async (ratingId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${ratingId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener calificación");
  }

  return await response.json();
};

// Actualizar una calificación
export const updateRatingApi = async (ratingId, ratingData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${ratingId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(ratingData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar calificación");
  }

  return await response.json();
};

// Eliminar una calificación
export const deleteRatingApi = async (ratingId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${ratingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar calificación");
  }

  return await response.json();
};

// Obtener estadísticas de calificaciones
export const getRatingStatsApi = async (filters = {}) => {
  const token = localStorage.getItem("token");

  // Construir query string con filtros
  const queryParams = new URLSearchParams(filters);

  const url = queryParams.toString()
    ? `${API_URL}/stats?${queryParams}`
    : `${API_URL}/stats`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener estadísticas de calificaciones"
    );
  }

  return await response.json();
};

// Obtener calificaciones por reserva
export const getRatingsByReservationApi = async (reservationId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/reservation/${reservationId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener calificaciones de la reserva"
    );
  }

  return await response.json();
};

// Obtener calificaciones por usuario
export const getRatingsByUserApi = async (
  userId,
  startDate = null,
  endDate = null
) => {
  const token = localStorage.getItem("token");

  // Construir query string con fechas si están presentes
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const url = queryParams.toString()
    ? `${API_URL}/user/${userId}?${queryParams}`
    : `${API_URL}/user/${userId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener calificaciones del usuario"
    );
  }

  return await response.json();
};

// Obtener calificaciones por recurso
export const getRatingsByResourceApi = async (
  resourceId,
  startDate = null,
  endDate = null
) => {
  const token = localStorage.getItem("token");

  // Construir query string con fechas si están presentes
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const url = queryParams.toString()
    ? `${API_URL}/resource/${resourceId}?${queryParams}`
    : `${API_URL}/resource/${resourceId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener calificaciones del recurso"
    );
  }

  return await response.json();
};

// Exportar todas las funciones como un objeto
export const ratingApi = {
  createRatingApi,
  getRatingsApi,
  getRatingsPaginatedApi,
  getRatingApi,
  updateRatingApi,
  deleteRatingApi,
  getRatingStatsApi,
  getRatingsByReservationApi,
  getRatingsByUserApi,
  getRatingsByResourceApi,
};

export default ratingApi;
