import { mockUsers, mockEmployees } from './mockData';

const USE_MOCK = true;

let mockUsersData = [...mockUsers];
let mockEmployeesData = [...mockEmployees];

export const login = async (email, password) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = mockUsersData.find(u => u.email === email);

    if (user && user.active) {
      return {
        data: {
          user,
          token: 'mock-jwt-token-' + Date.now(),
        },
        success: true,
        message: 'Login exitoso',
      };
    }

    return { success: false, message: 'Credenciales inválidas' };
  }

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return await response.json();
};

export const getUsers = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));

    let filtered = [...mockUsersData];

    if (filters.role) {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    if (filters.active !== undefined) {
      filtered = filtered.filter(u => u.active === filters.active);
    }

    return { data: filtered, success: true };
  }

  const queryParams = new URLSearchParams(filters).toString();
  const response = await fetch(`/api/users?${queryParams}`);
  return await response.json();
};

export const createUser = async (userData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const exists = mockUsersData.some(u => u.email === userData.email);

    if (exists) {
      return { success: false, message: 'El correo ya está registrado' };
    }

    const newUser = {
      ...userData,
      id: String(Date.now()),
      active: true,
    };
    mockUsersData.push(newUser);
    return { data: newUser, success: true, message: 'Usuario creado exitosamente' };
  }

  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await response.json();
};

export const updateUser = async (id, userData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockUsersData.findIndex(u => u.id === id);

    if (index !== -1) {
      mockUsersData[index] = { ...mockUsersData[index], ...userData };
      return { data: mockUsersData[index], success: true, message: 'Usuario actualizado' };
    }

    return { success: false, message: 'Usuario no encontrado' };
  }

  const response = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return await response.json();
};

export const deleteUser = async (id) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockUsersData.findIndex(u => u.id === id);

    if (index !== -1) {
      mockUsersData[index].active = false;
      return { success: true, message: 'Usuario desactivado' };
    }

    return { success: false, message: 'Usuario no encontrado' };
  }

  const response = await fetch(`/api/users/${id}`, {
    method: 'DELETE',
  });
  return await response.json();
};

export const getEmployees = async () => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: mockEmployeesData, success: true };
  }

  const response = await fetch('/api/employees');
  return await response.json();
};

export const createEmployee = async (employeeData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const exists = mockEmployeesData.some(e => e.email === employeeData.email);

    if (exists) {
      return { success: false, message: 'El correo ya está registrado' };
    }

    const newEmployee = {
      ...employeeData,
      id: String(Date.now()),
      active: true,
    };
    mockEmployeesData.push(newEmployee);
    return { data: newEmployee, success: true, message: 'Empleado creado exitosamente' };
  }

  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  return await response.json();
};

export const updateEmployee = async (id, employeeData) => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockEmployeesData.findIndex(e => e.id === id);

    if (index !== -1) {
      mockEmployeesData[index] = { ...mockEmployeesData[index], ...employeeData };
      return { data: mockEmployeesData[index], success: true, message: 'Empleado actualizado' };
    }

    return { success: false, message: 'Empleado no encontrado' };
  }

  const response = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  return await response.json();
};
