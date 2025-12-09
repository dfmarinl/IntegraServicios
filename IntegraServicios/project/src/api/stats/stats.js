const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${API_BASE}/api/stats`;

/**
 * HU-012: Obtener recursos más reservados
 */
export const getMostReservedResourcesApi = async (filters = {}) => {
  const token = localStorage.getItem("token");

  // Construir query params
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.resourceTypeId)
    params.append("resourceTypeId", filters.resourceTypeId);
  if (filters.limit) params.append("limit", filters.limit);

  const response = await fetch(
    `${API_URL}/most-reserved?${params.toString()}`,
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
    throw new Error(
      error.message || "Error al obtener recursos más reservados"
    );
  }

  return await response.json();
};

/**
 * HU-013: Obtener recurso más prestado
 */
export const getMostLoanedResourceApi = async (filters = {}) => {
  const token = localStorage.getItem("token");

  // Construir query params
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  const response = await fetch(`${API_URL}/most-loaned?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener recurso más prestado");
  }

  return await response.json();
};

/**
 * HU-018: Obtener reporte de calificaciones
 */
export const getRatingsReportApi = async (filters = {}) => {
  const token = localStorage.getItem("token");

  // Construir query params
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.resourceId) params.append("resourceId", filters.resourceId);
  if (filters.employeeId) params.append("employeeId", filters.employeeId);

  const response = await fetch(
    `${API_URL}/ratings-report?${params.toString()}`,
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
    throw new Error(
      error.message || "Error al obtener reporte de calificaciones"
    );
  }

  return await response.json();
};

/**
 * Obtener resumen de estadísticas
 */
export const getStatsSummaryApi = async (filters = {}) => {
  const token = localStorage.getItem("token");

  // Construir query params
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.resourceTypeId)
    params.append("resourceTypeId", filters.resourceTypeId);

  const response = await fetch(`${API_URL}/summary?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener resumen de estadísticas"
    );
  }

  return await response.json();
};
