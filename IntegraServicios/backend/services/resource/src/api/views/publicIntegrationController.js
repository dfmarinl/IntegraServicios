// services/resource/src/api/views/publicIntegrationController.js
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const { Op } = require("sequelize");

/**
 * Controlador para rutas públicas de integración
 */

const getPublicIntegrationResources = async (req, res) => {
  try {
    console.log("📡 Solicitud recibida en ruta pública de integración");

    // Buscar la unidad llamada "integración" (case-insensitive)
    const integrationUnit = await Unit.findOne({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: 'integración' } },
          { name: { [Op.iLike]: 'integracion' } },
          { name: { [Op.iLike]: 'integration' } }
        ],
        isActive: true
      },
      attributes: ['id', 'name', 'description'] // Solo columnas que existen
    });

    // Si no existe la unidad "integración"
    if (!integrationUnit) {
      console.log("⚠️  Unidad 'integración' no encontrada");
      return res.status(200).json({
        success: true,
        message: "Recursos de integración",
        data: {
          unit: null,
          resourceTypes: [],
          resources: [],
          message: "No hay recursos de integración disponibles actualmente"
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          status: "unit_not_found"
        }
      });
    }

    console.log(`✅ Unidad encontrada: ${integrationUnit.name} (ID: ${integrationUnit.id})`);

    // Obtener tipos de recursos activos - SOLO COLUMNAS QUE EXISTEN
    const resourceTypes = await ResourceType.findAll({
      where: {
        unitId: integrationUnit.id,
        isActive: true
      },
      attributes: ['id', 'name', 'description'], // Remover 'icon' si no existe
      order: [['name', 'ASC']]
    });

    console.log(`📋 Tipos de recursos encontrados: ${resourceTypes.length}`);

    // Obtener recursos activos de la unidad "integración"
    const resources = await Resource.findAll({
      where: {
        isActive: true
      },
      include: [
        {
          model: ResourceType,
          where: {
            unitId: integrationUnit.id,
            isActive: true
          },
          attributes: ['id', 'name', 'description'], // Remover 'icon' si no existe
          required: true
        }
      ],
      attributes: [
        'id', 
        'name', 
        'photoUrl', 
        'features',
        'isActive',
        'createdAt',
        'updatedAt'
      ],
      order: [
        ['ResourceType', 'name', 'ASC'],
        ['name', 'ASC']
      ]
    });

    console.log(`📦 Recursos encontrados: ${resources.length}`);

    // Formatear respuesta
    const formattedResources = resources.map(resource => ({
      id: resource.id,
      name: resource.name,
      photoUrl: resource.photoUrl,
      features: resource.features || {},
      isActive: resource.isActive,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      type: {
        id: resource.ResourceType.id,
        name: resource.ResourceType.name,
        description: resource.ResourceType.description
        // Remover icon si no existe
      }
    }));

    const formattedResourceTypes = resourceTypes.map(type => {
      // Contar recursos por tipo
      const resourceCount = resources.filter(
        r => r.ResourceType.id === type.id
      ).length;
      
      return {
        id: type.id,
        name: type.name,
        description: type.description,
        // Remover icon si no existe
        resourceCount: resourceCount,
        createdAt: type.createdAt
      };
    });

    // Construir respuesta final
    const response = {
      success: true,
      message: "Recursos de integración obtenidos exitosamente",
      data: {
        unit: {
          id: integrationUnit.id,
          name: integrationUnit.name,
          description: integrationUnit.description
        },
        resourceTypes: formattedResourceTypes,
        resources: formattedResources,
        summary: {
          totalResourceTypes: resourceTypes.length,
          totalResources: resources.length,
          lastUpdated: new Date().toISOString()
        }
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        status: "success"
      }
    };

    console.log(`✅ Respuesta enviada con ${resources.length} recursos`);
    res.status(200).json(response);

  } catch (error) {
    console.error("❌ Error en ruta pública de integración:", error);
    
    res.status(500).json({
      success: false,
      message: "Error interno del servidor al obtener recursos",
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        status: "error"
      }
    });
  }
};

/**
 * Health check para la API pública de integración
 */
const getPublicIntegrationHealth = async (req, res) => {
  try {
    // Verificar conexión a base de datos
    const unitCount = await Unit.count({
      where: { isActive: true }
    });

    const resourceCount = await Resource.count({
      where: { isActive: true }
    });

    res.status(200).json({
      success: true,
      service: "API Pública de Integración",
      status: "operational",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        units: unitCount,
        resources: resourceCount
      },
      endpoints: {
        resources: "/api/public/integration/resources",
        health: "/api/public/integration/health"
      },
      documentation: "Ruta pública para obtener recursos de la unidad 'integración'"
    });

  } catch (error) {
    console.error("❌ Error en health check:", error);
    
    res.status(500).json({
      success: false,
      service: "API Pública de Integración",
      status: "degraded",
      timestamp: new Date().toISOString(),
      error: "No se pudo conectar a la base de datos"
    });
  }
};

module.exports = {
  getPublicIntegrationResources,
  getPublicIntegrationHealth
};