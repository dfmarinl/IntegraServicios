const API_URL = "http://localhost:3001/api/users";

// Crear usuario
export const createUserApi = async (userData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear usuario");
  }

  return await response.json();
};

// Obtener usuarios paginados (SOLO ACTIVOS)
export const getUsersPaginatedApi = async (
  page = 1,
  limit = 6,
  search = "",
  role = ""
) => {
  const token = localStorage.getItem("token");

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(role && role !== "all" && { role }),
  });

  const response = await fetch(`${API_URL}/paginado?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener usuarios");
  }

  return await response.json();
};

// Obtener TODOS los usuarios (activos e inactivos - para administración)
export const getAllUsersApi = async () => {
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
    throw new Error(error.message || "Error al obtener todos los usuarios");
  }

  return await response.json();
};

// Obtener usuarios ACTIVOS (para combobox, etc.)
export const getActiveUsersApi = async () => {
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
    throw new Error(error.message || "Error al obtener usuarios activos");
  }

  return await response.json();
};

// Obtener usuario por ID
export const getUserByIdApi = async (userId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${userId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener usuario");
  }

  return await response.json();
};

// Actualizar usuario
export const updateUserApi = async (userId, userData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar usuario");
  }

  return await response.json();
};

// Desactivar usuario (eliminación lógica)
export const deleteUserApi = async (userId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al desactivar usuario");
  }

  return await response.json();
};

// Reactivar usuario
export const activateUserApi = async (userId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${userId}/activate`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al reactivar usuario");
  }

  return await response.json();
};
