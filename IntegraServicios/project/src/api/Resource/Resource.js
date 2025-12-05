const API_URL = "http://localhost:3001/api/resources";

// Create resource
export const createResourceApi = async (resourceData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear recurso");
  }

  return await response.json();
};

// Get all resources
export const getResourcesApi = async () => {
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
    throw new Error(error.message || "Error al obtener recursos");
  }

  return await response.json();
};

// ========== NUEVA FUNCIÓN ==========
// Get all ACTIVE resources
export const getActiveResourcesApi = async () => {
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
    throw new Error(error.message || "Error al obtener recursos activos");
  }

  return await response.json();
};

// ========== NUEVA FUNCIÓN ==========
// Get resources with pagination (ONLY ACTIVE)
export const getResourcesPaginatedApi = async (page = 1, limit = 6, typeId = null) => {
  const token = localStorage.getItem("token");

  let url = `${API_URL}/paginated?page=${page}&limit=${limit}`;
  if (typeId) {
    url += `&typeId=${typeId}`;
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
    throw new Error(error.message || "Error al obtener recursos");
  }

  return await response.json();
};

// Get resources by type
export const getResourcesByTypeApi = async (typeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/type/${typeId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener recursos por tipo");
  }

  return await response.json();
};

// Get active resources by type
export const getActiveResourcesByTypeApi = async (typeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/type/${typeId}/active`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener recursos activos por tipo");
  }

  return await response.json();
};

// Get specific resource
export const getResourceApi = async (resourceId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener recurso");
  }

  return await response.json();
};

// Update resource
export const updateResourceApi = async (resourceId, resourceData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar recurso");
  }

  return await response.json();
};

// Delete resource (soft delete - logical)
export const deleteResourceApi = async (resourceId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar recurso");
  }

  return await response.json();
};

// Destroy resource (permanent delete - only admin)
export const destroyResourceApi = async (resourceId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar permanentemente recurso");
  }

  return await response.json();
};

// ========== FUNCIÓN ADICIONAL ==========
// Update resource availability
export const updateResourceAvailabilityApi = async (resourceId, isAvailable) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${resourceId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ isAvailable }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar disponibilidad del recurso");
  }

  return await response.json();
};