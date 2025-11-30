const API_URL = "http://localhost:3001/api/resource-types";

// Create resource type
export const createResourceTypeApi = async (resourceTypeData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resourceTypeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear tipo de recurso");
  }

  return await response.json();
};

// Get all resource types
export const getResourceTypesApi = async () => {
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
    throw new Error(error.message || "Error al obtener tipos de recurso");
  }

  return await response.json();
};

// Get resource types by unit
export const getResourceTypesByUnitApi = async (unitId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/unit/${unitId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener tipos de recurso por unidad"
    );
  }

  return await response.json();
};

// Get active resource types by unit
export const getActiveResourceTypesByUnitApi = async (unitId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/unit/${unitId}/active`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al obtener tipos de recurso activos"
    );
  }

  return await response.json();
};

// Get specific resource type
export const getResourceTypeApi = async (resourceTypeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceTypeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener tipo de recurso");
  }

  return await response.json();
};

// Update resource type
export const updateResourceTypeApi = async (
  resourceTypeId,
  resourceTypeData
) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceTypeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resourceTypeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar tipo de recurso");
  }

  return await response.json();
};

// Delete resource type (soft delete - logical)
export const deleteResourceTypeApi = async (resourceTypeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceTypeId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar tipo de recurso");
  }

  return await response.json();
};

// Destroy resource type (permanent delete - only admin)
export const destroyResourceTypeApi = async (resourceTypeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceTypeId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Error al eliminar permanentemente tipo de recurso"
    );
  }

  return await response.json();
};
