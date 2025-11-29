const API_URL = "http://localhost:3001/api/units";

// Create unit
export const createUnitApi = async (unitData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(unitData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear unidad");
  }

  return await response.json();
};

// Get all units
export const getUnitsApi = async () => {
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
    throw new Error(error.message || "Error al obtener unidades");
  }

  return await response.json();
};

// Get active units only (solo activas - para usuarios frontend)
export const getActiveUnitsApi = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/active`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener unidades activas");
  }

  return await response.json();
};

// Get specific unit
export const getUnitApi = async (unitId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${unitId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener unidad");
  }

  return await response.json();
};

// Update unit
export const updateUnitApi = async (unitId, unitData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${unitId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(unitData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar unidad");
  }

  return await response.json();
};

// Delete unit
export const deleteUnitApi = async (unitId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${unitId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar unidad");
  }

  return await response.json();
};

// Get units with pagination ONLY (no search)
export const getUnitsPaginatedApi = async (page = 1, limit = 6) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/paginated?page=${page}&limit=${limit}`,
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
    throw new Error(error.message || "Error al obtener unidades");
  }

  return await response.json();
};
