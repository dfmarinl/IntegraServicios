// api/waysoftApi.js
// Cliente para consumir la API Waysoft

const API_URL = 'http://localhost:4001';
const API_KEY = 'waysoft-consultas-only-2024';

/**
 * Verifica la salud de la API
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check falló: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      connected: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Obtiene el estado del servicio
 */
export const getApiStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/status`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Status check falló: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Obtiene todos los laboratorios
 */
export const getLabs = async (filters = {}) => {
  try {
    // Construir query string
    const queryParams = new URLSearchParams();
    
    // Agregar filtros si existen
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${API_URL}/labs${queryString}`;
    
    console.log('🔍 Solicitando laboratorios:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('📡 Respuesta:', response.status, response.statusText);
    
    // Manejo de errores específicos
    if (response.status === 401) {
      throw new Error('No autorizado. Falta la API Key.');
    }
    
    if (response.status === 403) {
      throw new Error('Acceso denegado. API Key inválida o expirada.');
    }
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: data.data,
        pagination: data.pagination || {},
        filtersApplied: data.filters_applied || {},
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(data.error || 'Error desconocido en la respuesta');
    }
  } catch (error) {
    console.error('❌ Error al obtener laboratorios:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Verifica que el servidor esté corriendo',
        'Verifica que la API Key sea correcta',
        'Revisa la consola del servidor',
        'Prueba abrir la API en el navegador'
      ]
    };
  }
};

/**
 * Obtiene un laboratorio específico por ID
 */
export const getLabById = async (labId) => {
  try {
    const response = await fetch(`${API_URL}/labs/${labId}`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: data.data,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Verifica la disponibilidad de un laboratorio
 */
export const checkLabAvailability = async (labId, date, startTime, endTime) => {
  try {
    const queryParams = new URLSearchParams();
    if (date) queryParams.append('date', date);
    if (startTime) queryParams.append('startTime', startTime);
    if (endTime) queryParams.append('endTime', endTime);
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${API_URL}/availability/${labId}${queryString}`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(data.error || 'Error desconocido');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Prueba completa la conexión con la API
 */
export const testApiConnection = async () => {
  const results = {
    health: null,
    status: null,
    labs: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    console.log('🧪 Iniciando prueba de conexión...');
    
    // 1. Probar endpoint público
    results.health = await checkApiHealth();
    console.log('✅ Health check:', results.health.success ? 'OK' : 'FAILED');
    
    if (!results.health.success) {
      throw new Error(`Health check falló: ${results.health.error}`);
    }
    
    // 2. Probar endpoint protegido
    results.status = await getApiStatus();
    console.log('✅ Status check:', results.status.success ? 'OK' : 'FAILED');
    
    if (!results.status.success) {
      throw new Error(`Status check falló: ${results.status.error}`);
    }
    
    // 3. Probar obtención de laboratorios
    results.labs = await getLabs({ limit: 2 });
    console.log('✅ Labs check:', results.labs.success ? 'OK' : 'FAILED');
    
    if (!results.labs.success) {
      throw new Error(`Labs check falló: ${results.labs.error}`);
    }
    
    return {
      success: true,
      results: results,
      message: '✅ Todas las pruebas pasaron correctamente',
      service: results.status.data?.service,
      version: results.status.data?.version,
      labsCount: results.labs.data?.length || 0,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en prueba de conexión:', error);
    
    return {
      success: false,
      results: results,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Helper para obtener icono según categoría
 */
export const getCategoryIcon = (category) => {
  switch (category) {
    case 'cisco': return '🖧';
    case 'cybersecurity': return '🔒';
    case 'voip': return '📞';
    case 'wifi': return '📶';
    default: return '💻';
  }
};

/**
 * Helper para obtener color según categoría
 */
export const getCategoryColor = (category) => {
  switch (category) {
    case 'cisco': return '#2563eb';
    case 'cybersecurity': return '#dc2626';
    case 'voip': return '#7c3aed';
    case 'wifi': return '#059669';
    default: return '#6b7280';
  }
};

/**
 * Helper para formatear moneda
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Helper para obtener badge de estado
 */
export const getStatusBadge = (status) => {
  switch (status) {
    case 'available':
      return { text: 'Disponible', className: 'status-available', color: '#065f46' };
    case 'maintenance':
      return { text: 'En mantenimiento', className: 'status-maintenance', color: '#92400e' };
    case 'reserved':
      return { text: 'Reservado', className: 'status-reserved', color: '#3730a3' };
    default:
      return { text: status, className: 'status-other', color: '#6b7280' };
  }
};

/**
 * Configuración de la API para exportar
 */
export const apiConfig = {
  url: API_URL,
  key: API_KEY,
  endpoints: {
    health: `${API_URL}/health`,
    status: `${API_URL}/status`,
    labs: `${API_URL}/labs`,
    docs: `${API_URL}/api-docs`
  }
};

export default {
  checkApiHealth,
  getApiStatus,
  getLabs,
  getLabById,
  checkLabAvailability,
  testApiConnection,
  getCategoryIcon,
  getCategoryColor,
  formatCurrency,
  getStatusBadge,
  apiConfig
};