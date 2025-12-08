const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const { Op } = require("sequelize");

// Crear recurso
const createResource = async (req, res) => {
  try {
    const { name, photoUrl, features, typeId } = req.body;

    // Validaciones básicas
    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    if (!photoUrl) {
      return res.status(400).json({ message: "La URL de la foto es requerida" });
    }

    if (!typeId) {
      return res.status(400).json({ message: "El ID del tipo de recurso es requerido" });
    }

    // Verificar que el tipo de recurso exista
    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    // Verificar si ya existe un recurso con el mismo nombre (case-insensitive) en el mismo tipo
    const existingResource = await Resource.findOne({
      where: {
        typeId,
        name: {
          [Op.iLike]: name,
        },
      },
    });

    if (existingResource) {
      return res.status(400).json({
        message: `Ya existe un recurso con el nombre '${name}' en este tipo de recurso`,
      });
    }

    // Crear el recurso
    const resource = await Resource.create({
      name: name.trim(),
      photoUrl,
      features: features || {},
      typeId,
    });

    // Cargar relaciones para la respuesta
    const resourceWithRelations = await Resource.findByPk(resource.id, {
      include: [
        {
          model: ResourceType,
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
    });

    res.status(201).json({
      message: "Recurso creado exitosamente",
      resource: resourceWithRelations,
    });
  } catch (err) {
    console.error("Error al crear recurso:", err);

    // Manejar errores de Sequelize
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Ya existe un recurso con este nombre en el tipo de recurso",
      });
    }

    res.status(400).json({ message: err.message });
  }
};

// Crear múltiples recursos del mismo tipo
const createMultipleResources = async (req, res) => {
  try {
    const { name, photoUrl, features, typeId, quantity } = req.body;

    // Validaciones básicas
    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    if (!photoUrl) {
      return res.status(400).json({ message: "La URL de la foto es requerida" });
    }

    if (!typeId) {
      return res.status(400).json({ message: "El ID del tipo de recurso es requerido" });
    }

    // Validar cantidad
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return res.status(400).json({ 
        message: "La cantidad debe ser un número entero mayor a 0" 
      });
    }

    if (quantity > 100) {
      return res.status(400).json({ 
        message: "La cantidad máxima permitida es 100 recursos por lote" 
      });
    }

    // Verificar que el tipo de recurso exista
    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    // Verificar si ya existen recursos con el mismo nombre base en este tipo
    const existingResources = await Resource.findAll({
      where: {
        typeId,
        name: {
          [Op.iLike]: `${name}%`,
        },
      },
    });

    // Generar nombres únicos para los nuevos recursos
    const existingNames = existingResources.map(r => r.name.toLowerCase());
    const newResources = [];

    for (let i = 1; i <= quantity; i++) {
      let resourceName = quantity === 1 ? name.trim() : `${name.trim()} ${i}`;
      
      // Si el nombre ya existe, agregar sufijo incremental
      let counter = 0;
      while (existingNames.includes(resourceName.toLowerCase())) {
        counter++;
        resourceName = quantity === 1 
          ? `${name.trim()} ${counter + 1}`
          : `${name.trim()} ${i}-${counter + 1}`;
      }

      existingNames.push(resourceName.toLowerCase());
      newResources.push({
        name: resourceName,
        photoUrl,
        features: features || {},
        typeId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Crear todos los recursos en una transacción
    const createdResources = await Resource.bulkCreate(newResources, {
      returning: true,
      validate: true
    });

    // Obtener los recursos creados con sus relaciones
    const resourceIds = createdResources.map(r => r.id);
    const resourcesWithRelations = await Resource.findAll({
      where: {
        id: {
          [Op.in]: resourceIds
        }
      },
      include: [
        {
          model: ResourceType,
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.status(201).json({
      message: `${quantity} recursos creados exitosamente`,
      count: createdResources.length,
      resources: resourcesWithRelations,
    });
  } catch (err) {
    console.error("Error al crear múltiples recursos:", err);

    // Manejar errores de Sequelize
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Ya existe un recurso con este nombre en el tipo de recurso",
      });
    }

    if (err.name === "SequelizeValidationError") {
      const errors = err.errors.map(error => error.message);
      return res.status(400).json({
        message: "Error de validación",
        errors
      });
    }

    res.status(400).json({ 
      message: "Error al crear recursos", 
      error: err.message 
    });
  }
};


// Obtener todos los recursos
const getResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      include: [
        {
          model: ResourceType,
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.json(resources);
  } catch (err) {
    console.error("Error al obtener recursos:", err);
    res.status(500).json({ message: "Error al obtener recursos" });
  }
};

// Obtener todos los recursos ACTIVOS
const getActiveResources = async (req, res) => {
  try {
    const resources = await Resource.findAll({
      where: { isActive: true },
      include: [
        {
          model: ResourceType,
          where: { isActive: true },
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.json(resources);
  } catch (err) {
    console.error("Error al obtener recursos activos:", err);
    res.status(500).json({ message: "Error al obtener recursos activos" });
  }
};

// Obtener recursos con paginación (SOLO ACTIVOS)
const getResourcesPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 10, typeId } = req.query;
    const offset = (page - 1) * limit;

    // Construir condiciones de búsqueda
    const whereConditions = { isActive: true };
    if (typeId) {
      whereConditions.typeId = typeId;
    }

    const { count, rows: resources } = await Resource.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: ResourceType,
          where: { isActive: true },
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      resources,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error al paginar recursos:", error);
    res.status(500).json({
      message: "Error al paginar recursos: " + error.message,
    });
  }
};

// Obtener recursos por tipo
const getResourcesByType = async (req, res) => {
  try {
    const { typeId } = req.params;

    // Verificar que el tipo de recurso exista
    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const resources = await Resource.findAll({
      where: { typeId },
      include: [
        {
          model: ResourceType,
          include: [
            {
              model: Unit,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json(resources);
  } catch (err) {
    console.error("Error al obtener recursos por tipo:", err);
    res.status(500).json({ message: "Error al obtener recursos" });
  }
};

// Obtener recursos ACTIVOS por tipo
const getActiveResourcesByType = async (req, res) => {
  try {
    const { typeId } = req.params;

    const resources = await Resource.findAll({
      where: {
        typeId,
        isActive: true,
      },
      include: [
        {
          model: ResourceType,
          where: { isActive: true },
          include: [
            {
              model: Unit,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json(resources);
  } catch (err) {
    console.error("Error al obtener recursos activos por tipo:", err);
    res.status(500).json({ message: "Error al obtener recursos" });
  }
};

// Obtener un recurso específico
const getResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [
        {
          model: ResourceType,
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
    });

    if (!resource) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    res.json(resource);
  } catch (err) {
    console.error("Error al obtener recurso:", err);
    res.status(500).json({ message: "Error al obtener recurso" });
  }
};

// Actualizar un recurso
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    const { name, typeId } = req.body;

    // Si se está cambiando el tipo, verificar que exista
    if (typeId && typeId !== resource.typeId) {
      const resourceType = await ResourceType.findByPk(typeId);
      if (!resourceType) {
        return res.status(404).json({ message: "Tipo de recurso no encontrado" });
      }
    }

    // Si se está cambiando el nombre, verificar que no exista duplicado (case-insensitive) en el mismo tipo
    if (name && name.toLowerCase() !== resource.name.toLowerCase()) {
      const targetTypeId = typeId || resource.typeId;
      
      const existingResource = await Resource.findOne({
        where: {
          typeId: targetTypeId,
          name: {
            [Op.iLike]: name,
          },
          id: {
            [Op.ne]: resource.id,
          },
        },
      });

      if (existingResource) {
        return res.status(400).json({
          message: `Ya existe un recurso con el nombre '${name}' en este tipo de recurso`,
        });
      }
    }

    await resource.update({
      ...req.body,
      name: name ? name.trim() : resource.name,
    });

    // Cargar relaciones actualizadas para la respuesta
    const updatedResource = await Resource.findByPk(resource.id, {
      include: [
        {
          model: ResourceType,
          include: [
            {
              model: Unit,
              attributes: ["id", "name", "description"],
            },
          ],
        },
      ],
    });

    res.json({
      message: "Recurso actualizado exitosamente",
      resource: updatedResource,
    });
  } catch (err) {
    console.error("Error al actualizar recurso:", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Ya existe un recurso con este nombre en el tipo de recurso",
      });
    }

    res.status(500).json({ message: err.message });
  }
};

// Eliminar un recurso (eliminación lógica)
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    // Eliminación lógica en lugar de física
    await resource.update({ isActive: false });

    res.json({
      message: "Recurso desactivado correctamente",
    });
  } catch (err) {
    console.error("Error al eliminar recurso:", err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminación física de recurso (solo para administradores)
const destroyResource = async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Recurso no encontrado" });
    }

    // Verificar si tiene reservas asociadas (cuando implementes el módulo de reservas)
    // if (resource.Reservations && resource.Reservations.length > 0) {
    //   return res.status(400).json({
    //     message: "No se puede eliminar el recurso porque tiene reservas asociadas"
    //   });
    // }

    await resource.destroy();
    res.json({
      message: "Recurso eliminado permanentemente",
    });
  } catch (err) {
    console.error("Error al eliminar recurso:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createResource,
  getResources,
  getActiveResources,
  getResourcesPaginated,
  getResourcesByType,
  getActiveResourcesByType,
  getResource,
  updateResource,
  deleteResource,
  destroyResource,
  createMultipleResources,
};