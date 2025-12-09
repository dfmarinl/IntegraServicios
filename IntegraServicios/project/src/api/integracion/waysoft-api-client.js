// api/waysoftApi.js
// Cliente para consumir la API de ReservasPro

const API_URL = 'https://www.reservaspro.xyz';

/**
 * Obtiene todos los espacios disponibles
 */
export const getSpaces = async (filters = {}) => {
  try {
    console.log('🔍 Solicitando espacios desde:', `${API_URL}/espacios`);
    
    const response = await fetch(`${API_URL}/espacios`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Respuesta:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Aplicar filtros si existen
    let filteredData = data;
    
    if (filters.tipo && filters.tipo !== 'todos') {
      filteredData = filteredData.filter(space => 
        space.tipo.toLowerCase() === filters.tipo.toLowerCase()
      );
    }
    
    if (filters.capacidadMin) {
      filteredData = filteredData.filter(space => 
        space.capacidad >= parseInt(filters.capacidadMin)
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredData = filteredData.filter(space => 
        space.nombre.toLowerCase().includes(searchLower) ||
        space.descripcion.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      success: true,
      data: filteredData,
      total: filteredData.length,
      filtersApplied: filters,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error al obtener espacios:', error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      suggestions: [
        'Verifica que la URL sea correcta: https://www.reservaspro.xyz/espacios',
        'Verifica tu conexión a internet',
        'Prueba abrir la URL en el navegador'
      ]
    };
  }
};

/**
 * Obtiene espacios por tipo específico
 */
export const getSpacesByType = async (type) => {
  try {
    const result = await getSpaces({ tipo: type });
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Obtiene un espacio específico por ID
 */
export const getSpaceById = async (spaceId) => {
  try {
    const result = await getSpaces();
    
    if (result.success) {
      const space = result.data.find(s => s.id === parseInt(spaceId));
      
      if (space) {
        return {
          success: true,
          data: space,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`Espacio con ID ${spaceId} no encontrado`);
      }
    } else {
      throw new Error(result.error);
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
 * Obtiene estadísticas de los espacios
 */
export const getSpaceStats = async () => {
  try {
    const result = await getSpaces();
    
    if (result.success) {
      const stats = {
        total: result.data.length,
        byType: {},
        totalCapacity: 0,
        averageCapacity: 0
      };
      
      // Calcular estadísticas
      result.data.forEach(space => {
        // Conteo por tipo
        if (!stats.byType[space.tipo]) {
          stats.byType[space.tipo] = {
            count: 0,
            totalCapacity: 0
          };
        }
        stats.byType[space.tipo].count++;
        stats.byType[space.tipo].totalCapacity += space.capacidad;
        
        // Capacidad total
        stats.totalCapacity += space.capacidad;
      });
      
      // Calcular promedio
      stats.averageCapacity = stats.total > 0 ? 
        Math.round(stats.totalCapacity / stats.total) : 0;
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(result.error);
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
 * Prueba de conexión con la API
 */
export const testApiConnection = async () => {
  try {
    console.log('🧪 Probando conexión con ReservasPro API...');
    
    const startTime = Date.now();
    const result = await getSpaces();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (result.success) {
      return {
        success: true,
        message: `✅ Conexión exitosa - ${result.data.length} espacios encontrados`,
        data: {
          spacesCount: result.data.length,
          responseTime: `${responseTime}ms`,
          serverTimestamp: result.timestamp
        },
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(result.error);
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
 * Helper para obtener icono según tipo de espacio
 */
export const getCategoryIcon = (tipo) => {
  const icons = {
    'Aula': '🏫',
    'Laboratorio de Computación': '💻',
    'Laboratorio de Física': '🔬',
    'Auditorio': '🎭'
  };
  return icons[tipo] || '📍';
};

/**
 * Helper para obtener color según tipo de espacio
 */
export const getCategoryColor = (tipo) => {
  const colors = {
    'Aula': '#3B82F6', // Azul
    'Laboratorio de Computación': '#10B981', // Verde
    'Laboratorio de Física': '#8B5CF6', // Violeta
    'Auditorio': '#F59E0B' // Amarillo
  };
  return colors[tipo] || '#6B7280';
};

/**
 * Helper para obtener badge de estado
 */
export const getStatusBadge = (status) => {
  switch (status) {
    case 'available':
      return { text: 'Disponible', color: '#10B981', icon: '✅' };
    case 'occupied':
      return { text: 'Ocupado', color: '#EF4444', icon: '❌' };
    case 'maintenance':
      return { text: 'Mantenimiento', color: '#F59E0B', icon: '🛠️' };
    default:
      return { text: 'Desconocido', color: '#6B7280', icon: '❓' };
  }
};

/**
 * Helper para formatear capacidad
 */
export const formatCapacity = (capacidad) => {
  if (capacidad >= 100) {
    return `${capacidad}+ personas`;
  } else if (capacidad >= 50) {
    return `${capacidad} personas`;
  } else {
    return `${capacidad} personas`;
  }
};

/**
 * Configuración de la API para exportar
 */
export const apiConfig = {
  url: API_URL,
  endpoint: `${API_URL}/espacios`,
  endpoints: {
    spaces: `${API_URL}/espacios`,
    docs: API_URL
  }
};

export default {
  getSpaces,
  getSpacesByType,
  getSpaceById,
  getSpaceStats,
  testApiConnection,
  getCategoryIcon,
  getCategoryColor,
  getStatusBadge,
  formatCapacity,
  apiConfig
};