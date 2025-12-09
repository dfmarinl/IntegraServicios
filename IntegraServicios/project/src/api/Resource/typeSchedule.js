// services/typeScheduleApi.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
const API_URL = `${API_BASE}/api/type-schedules`;


// Create schedule for a resource type
export const createTypeScheduleApi = async (typeId, scheduleData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${typeId}/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear horario del tipo de recurso");
  }

  return await response.json();
};

// Get all schedules for a resource type
export const getTypeSchedulesApi = async (typeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${typeId}/schedules`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener horarios del tipo de recurso");
  }

  return await response.json();
};

// Get complete weekly schedule for a resource type
export const getCompleteTypeScheduleApi = async (typeId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${typeId}/schedules/complete`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener horario completo del tipo de recurso");
  }

  return await response.json();
};

// Update specific schedule
export const updateTypeScheduleApi = async (scheduleId, scheduleData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al actualizar horario del tipo de recurso");
  }

  return await response.json();
};

// Delete specific schedule
export const deleteTypeScheduleApi = async (scheduleId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/schedules/${scheduleId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al eliminar horario del tipo de recurso");
  }

  return await response.json();
};

// Toggle day schedule active status
export const toggleDayScheduleApi = async (typeId, dayOfWeek, isActive) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/${typeId}/schedules/${dayOfWeek}/toggle`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al cambiar estado del día del tipo de recurso");
  }

  return await response.json();
};

// Add multiple schedules at once
export const addMultipleSchedulesApi = async (typeId, schedules) => {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_URL}/${typeId}/schedules/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ schedules }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear horarios múltiples del tipo de recurso");
  }

  return await response.json();
};

// Update all schedules for a resource type
export const updateAllTypeSchedulesApi = async (typeId, schedules) => {
  try {
    const response = await fetch(`${API_URL}/${typeId}/schedules/bulk`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ schedules }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error updating type schedules");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error updating all type schedules:", error);
    throw error;
  }
};

export default {
  createTypeScheduleApi,
  getTypeSchedulesApi,
  getCompleteTypeScheduleApi,
  updateTypeScheduleApi,
  deleteTypeScheduleApi,
  toggleDayScheduleApi,
  addMultipleSchedulesApi,
  updateAllTypeSchedulesApi,
};