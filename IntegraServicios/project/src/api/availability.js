import { mockAvailability } from './mockData';

const USE_MOCK = true;

let mockAvailabilityData = [...mockAvailability];

export const getAvailability = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));

    let filtered = [...mockAvailabilityData];

    if (filters.resourceTypeId) {
      filtered = filtered.filter(a => a.resourceTypeId === filters.resourceTypeId);
    }

    return { data: filtered, success: true };
  }

  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/availability?${queryParams}`);
  return await response.json();
};

export const createAvailability = async (availabilityData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const hasOverlap = mockAvailabilityData.some(a =>
      a.resourceTypeId === availabilityData.resourceTypeId &&
      a.dayOfWeek === availabilityData.dayOfWeek &&
      (
        (availabilityData.startTime >= a.startTime && availabilityData.startTime < a.endTime) ||
        (availabilityData.endTime > a.startTime && availabilityData.endTime <= a.endTime)
      )
    );

    if (hasOverlap) {
      return { success: false, message: 'Existe un traslape con otra disponibilidad' };
    }

    const newAvailability = {
      ...availabilityData,
      id: String(Date.now()),
    };
    mockAvailabilityData.push(newAvailability);
    return { data: newAvailability, success: true, message: 'Disponibilidad creada exitosamente' };
  }

  const response = await fetch('/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(availabilityData),
  });
  return await response.json();
};

export const updateAvailability = async (id, availabilityData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockAvailabilityData.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAvailabilityData[index] = { ...mockAvailabilityData[index], ...availabilityData };
      return { data: mockAvailabilityData[index], success: true, message: 'Disponibilidad actualizada' };
    }
    return { success: false, message: 'Disponibilidad no encontrada' };
  }

  const response = await fetch(`/api/availability/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(availabilityData),
  });
  return await response.json();
};

export const deleteAvailability = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockAvailabilityData.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAvailabilityData.splice(index, 1);
      return { success: true, message: 'Disponibilidad eliminada' };
    }
    return { success: false, message: 'Disponibilidad no encontrada' };
  }

  const response = await fetch(`/api/availability/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};
