const API_URL = "http://localhost:3001/api/unit-schedules";

// Create schedule for a unit
export const createUnitScheduleApi = async (unitId, scheduleData) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${unitId}/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(scheduleData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear horario");
  }

  return await response.json();
};

// Get all schedules for a unit
export const getUnitSchedulesApi = async (unitId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${unitId}/schedules`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener horarios");
  }

  return await response.json();
};

// Get complete weekly schedule for a unit
export const getCompleteUnitScheduleApi = async (unitId) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/${unitId}/schedules/complete`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al obtener horario completo");
  }

  return await response.json();
};

// Update specific schedule
export const updateUnitScheduleApi = async (scheduleId, scheduleData) => {
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
    throw new Error(error.message || "Error al actualizar horario");
  }

  return await response.json();
};

// Delete specific schedule
export const deleteUnitScheduleApi = async (scheduleId) => {
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
    throw new Error(error.message || "Error al eliminar horario");
  }

  return await response.json();
};

// Toggle day schedule active status
export const toggleDayScheduleApi = async (unitId, dayOfWeek, isActive) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/${unitId}/schedules/${dayOfWeek}/toggle`,
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
    throw new Error(error.message || "Error al cambiar estado del día");
  }

  return await response.json();
};

// Add multiple schedules at once
export const addMultipleSchedulesApi = async (unitId, schedules) => {
  const token = localStorage.getItem("token");
  console.log(schedules);
  const response = await fetch(`${API_URL}/${unitId}/schedules/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ schedules }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear horarios múltiples");
  }

  return await response.json();
};
