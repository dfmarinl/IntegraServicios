const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${API_BASE}/api/returns`;


// Crear devolución (registrar recepción)
export const createReturnApi = async (returnData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(returnData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear devolución");
  }

  return await response.json();
};

// Obtener todas las devoluciones
export const getReturnsApi = async () => {
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
    throw new Error(error.message || "Error al obtener devoluciones");
  }

  return await response.json();
};

// Obtener devoluciones paginadas
export const getReturnsPaginatedApi = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  const token = localStorage.getItem("token");

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
    throw new Error(error.message || "Error al obtener devoluciones paginadas");
  }

  return await response.json();
};

// Obtener una devolución específica
export const getReturnApi = async (returnId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${returnId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener devolución");
  }

  return await response.json();
};

// Actualizar una devolución
export const updateReturnApi = async (returnId, returnData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${returnId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(returnData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar devolución");
  }

  return await response.json();
};

// Eliminar una devolución
export const deleteReturnApi = async (returnId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${returnId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar devolución");
  }

  return await response.json();
};

// Obtener estadísticas de devoluciones
export const getReturnStatsApi = async (startDate = null, endDate = null) => {
  const token = localStorage.getItem("token");

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
      error.message || "Error al obtener estadísticas de devoluciones"
    );
  }

  return await response.json();
};

// Obtener devoluciones por préstamo
export const getReturnsByLoanApi = async (loanId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/loan/${loanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener devoluciones del préstamo"
    );
  }

  return await response.json();
};

// Obtener devoluciones por empleado
export const getReturnsByEmployeeApi = async (
  employeeId,
  startDate = null,
  endDate = null
) => {
  const token = localStorage.getItem("token");

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
    throw new Error(
      error.message || "Error al obtener devoluciones del empleado"
    );
  }

  return await response.json();
};

// Verificar si existe devolución para un préstamo
export const checkReturnExistsApi = async (loanId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/check/${loanId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al verificar devolución");
  }

  return await response.json();
};

// Añadir a tu archivo loansApi.js existente
export const checkReturnExistsForLoanApi = async (loanId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL.replace("/loans", "/returns")}/check/${loanId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    // Si no hay devolución, devolver false
    if (response.status === 404) {
      return { exists: false };
    }
    const error = await response.json();
    throw new Error(error.message || "Error al verificar devolución");
  }

  return await response.json();
};
