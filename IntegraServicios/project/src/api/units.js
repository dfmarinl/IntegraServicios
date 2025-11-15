import { mockUnits } from './mockData';

const USE_MOCK = true;

let mockUnitsData = [...mockUnits];

export const getUnits = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: mockUnitsData, success: true };
  }

  const response = await fetch('/api/units');
  return await response.json();
};

export const getUnitById = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const unit = mockUnitsData.find(u => u.id === id);
    return { data: unit, success: !!unit };
  }

  const response = await fetch(`/api/units/${id}`);
  return await response.json();
};

export const createUnit = async (unitData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const exists = mockUnitsData.some(u =>
      u.name.toLowerCase() === unitData.name.toLowerCase()
    );

    if (exists) {
      return { success: false, message: 'Ya existe una unidad con ese nombre' };
    }

    const newUnit = {
      ...unitData,
      id: String(Date.now()),
      active: true,
    };
    mockUnitsData.push(newUnit);
    return { data: newUnit, success: true, message: 'Unidad creada exitosamente' };
  }

  const response = await fetch('/api/units', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unitData),
  });
  return await response.json();
};

export const updateUnit = async (id, unitData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockUnitsData.findIndex(u => u.id === id);

    if (index !== -1) {
      mockUnitsData[index] = { ...mockUnitsData[index], ...unitData };
      return { data: mockUnitsData[index], success: true, message: 'Unidad actualizada exitosamente' };
    }

    return { success: false, message: 'Unidad no encontrada' };
  }

  const response = await fetch(`/api/units/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unitData),
  });
  return await response.json();
};

export const deleteUnit = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockUnitsData.findIndex(u => u.id === id);

    if (index !== -1) {
      mockUnitsData[index].active = false;
      return { success: true, message: 'Unidad desactivada' };
    }

    return { success: false, message: 'Unidad no encontrada' };
  }

  const response = await fetch(`/api/units/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};
