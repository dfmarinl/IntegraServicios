import { mockResources } from './mockData';

const USE_MOCK = true;

let mockResourcesData = [...mockResources];

export const getResources = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filtered = [...mockResourcesData];

    if (filters.typeId) {
      filtered = filtered.filter(r => r.typeId === filters.typeId);
    }
    if (filters.available !== undefined) {
      filtered = filtered.filter(r => r.available === filters.available);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower)
      );
    }

    return { data: filtered, success: true };
  }

  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/resources?${queryParams}`);
  return await response.json();
};

export const getResourceById = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const resource = mockResourcesData.find(r => r.id === id);
    return { data: resource, success: !!resource };
  }

  const response = await fetch(`/api/resources/${id}`);
  return await response.json();
};

export const createResource = async (resourceData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const newResource = {
      ...resourceData,
      id: String(Date.now()),
      available: true,
    };
    mockResourcesData.push(newResource);
    return { data: newResource, success: true, message: 'Recurso creado exitosamente' };
  }

  const response = await fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resourceData),
  });
  return await response.json();
};

export const updateResource = async (id, resourceData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const index = mockResourcesData.findIndex(r => r.id === id);
    if (index !== -1) {
      mockResourcesData[index] = { ...mockResourcesData[index], ...resourceData };
      return { data: mockResourcesData[index], success: true, message: 'Recurso actualizado exitosamente' };
    }
    return { success: false, message: 'Recurso no encontrado' };
  }

  const response = await fetch(`/api/resources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resourceData),
  });
  return await response.json();
};

export const deleteResource = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockResourcesData.findIndex(r => r.id === id);
    if (index !== -1) {
      mockResourcesData.splice(index, 1);
      return { success: true, message: 'Recurso eliminado exitosamente' };
    }
    return { success: false, message: 'Recurso no encontrado' };
  }

  const response = await fetch(`/api/resources/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};
