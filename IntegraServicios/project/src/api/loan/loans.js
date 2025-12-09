const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${API_BASE}/api/loans`;


// Crear préstamo (registrar entrega)
export const createLoanApi = async (loanData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(loanData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear préstamo");
  }

  return await response.json();
};

// Obtener todos los préstamos
export const getLoansApi = async () => {
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
    throw new Error(error.message || "Error al obtener préstamos");
  }

  return await response.json();
};

// Obtener préstamos paginados
export const getLoansPaginatedApi = async (
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
    throw new Error(error.message || "Error al obtener préstamos paginados");
  }

  return await response.json();
};

// Obtener un préstamo específico
export const getLoanApi = async (loanId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${loanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener préstamo");
  }

  return await response.json();
};

// Actualizar un préstamo
export const updateLoanApi = async (loanId, loanData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${loanId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(loanData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar préstamo");
  }

  return await response.json();
};

// Eliminar un préstamo
export const deleteLoanApi = async (loanId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${loanId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar préstamo");
  }

  return await response.json();
};

// Obtener estadísticas de préstamos
export const getLoanStatsApi = async (startDate = null, endDate = null) => {
  const token = localStorage.getItem("token");

  // Construir query string con fechas si están presentes
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

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
      error.message || "Error al obtener estadísticas de préstamos"
    );
  }

  return await response.json();
};

// Obtener préstamos por reserva
export const getLoansByReservationApi = async (reservationId) => {
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
      error.message || "Error al obtener préstamos de la reserva"
    );
  }

  return await response.json();
};

// Obtener préstamos por empleado
export const getLoansByEmployeeApi = async (
  employeeId,
  startDate = null,
  endDate = null
) => {
  const token = localStorage.getItem("token");

  // Construir query string con fechas si están presentes
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const url = queryParams.toString()
    ? `${API_URL}/employee/${employeeId}?${queryParams}`
    : `${API_URL}/employee/${employeeId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener préstamos del empleado");
  }

  return await response.json();
};
