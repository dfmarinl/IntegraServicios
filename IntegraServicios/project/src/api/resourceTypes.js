import { mockResourceTypes } from './mockData';

const USE_MOCK = true;

let mockTypesData = [...mockResourceTypes];

export const getResourceTypes = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: mockTypesData, success: true };
  }

  const response = await fetch('/api/resource-types');
  return await response.json();
};

export const getResourceTypeById = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const type = mockTypesData.find(t => t.id === id);
    return { data: type, success: !!type };
  }

  const response = await fetch(`/api/resource-types/${id}`);
  return await response.json();
};

export const createResourceType = async (typeData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const exists = mockTypesData.some(t =>
      t.name.toLowerCase() === typeData.name.toLowerCase()
    );

    if (exists) {
      return { success: false, message: 'Ya existe un tipo de recurso con ese nombre' };
    }

    const newType = {
      ...typeData,
      id: String(Date.now()),
    };
    mockTypesData.push(newType);
    return { data: newType, success: true, message: 'Tipo de recurso creado exitosamente' };
  }

  const response = await fetch('/api/resource-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeData),
  });
  return await response.json();
};

export const updateResourceType = async (id, typeData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockTypesData.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTypesData[index] = { ...mockTypesData[index], ...typeData };
      return { data: mockTypesData[index], success: true, message: 'Tipo actualizado exitosamente' };
    }
    return { success: false, message: 'Tipo no encontrado' };
  }

  const response = await fetch(`/api/resource-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeData),
  });
  return await response.json();
};

export const deleteResourceType = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockTypesData.findIndex(t => t.id === id);
    if (index !== -1) {
      mockTypesData.splice(index, 1);
      return { success: true, message: 'Tipo eliminado exitosamente' };
    }
    return { success: false, message: 'Tipo no encontrado' };
  }

  const response = await fetch(`/api/resource-types/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};
