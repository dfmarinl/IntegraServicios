const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const { Op } = require("sequelize");

// Crear tipo de recurso
const createResourceType = async (req, res) => {
  try {
    const { name, description, granularity = 30, unitId } = req.body;

    // Validaciones básicas
    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    if (!unitId) {
      return res
        .status(400)
        .json({ message: "El ID de la unidad es requerido" });
    }

    // Validar granularidad
    if (granularity < 15 || granularity > 480) {
      return res.status(400).json({
        message: "La granularidad debe estar entre 15 y 480 minutos",
      });
    }

    // Verificar que la unidad exista
    const unit = await Unit.findByPk(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }

    // Verificar si ya existe un tipo de recurso con el mismo nombre (case-insensitive) en la misma unidad
    const existingResourceType = await ResourceType.findOne({
      where: {
        unitId,
        name: {
          [Op.iLike]: name, // Case-insensitive comparison
        },
      },
    });

    if (existingResourceType) {
      return res.status(400).json({
        message: `Ya existe un tipo de recurso con el nombre '${name}' en esta unidad`,
      });
    }

    // Crear el tipo de recurso
    const resourceType = await ResourceType.create({
      name: name.trim(),
      description,
      granularity,
      unitId,
    });

    res.status(201).json({
      message: "Tipo de recurso creado exitosamente",
      resourceType,
    });
  } catch (err) {
    console.error("Error al crear tipo de recurso:", err);

    // Manejar errores de Sequelize
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Ya existe un tipo de recurso con este nombre en la unidad",
      });
    }

    res.status(400).json({ message: err.message });
  }
};

// Obtener todos los tipos de recurso
const getResourceTypes = async (req, res) => {
  try {
    const resourceTypes = await ResourceType.findAll({
      include: [
        {
          model: Unit,
          attributes: ["id", "name", "description"],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.json(resourceTypes);
  } catch (err) {
    console.error("Error al obtener tipos de recurso:", err);
    res.status(500).json({ message: "Error al obtener tipos de recurso" });
  }
};

// Obtener tipos de recurso por unidad
const getResourceTypesByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;

    // Verificar que la unidad exista
    const unit = await Unit.findByPk(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }

    const resourceTypes = await ResourceType.findAll({
      where: { unitId },
      include: [
        {
          model: Unit,
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json(resourceTypes);
  } catch (err) {
    console.error("Error al obtener tipos de recurso por unidad:", err);
    res.status(500).json({ message: "Error al obtener tipos de recurso" });
  }
};

// Obtener tipos de recurso ACTIVOS por unidad
const getActiveResourceTypesByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;

    const resourceTypes = await ResourceType.findAll({
      where: {
        unitId,
        isActive: true,
      },
      include: [
        {
          model: Unit,
          attributes: ["id", "name"],
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json(resourceTypes);
  } catch (err) {
    console.error("Error al obtener tipos de recurso activos por unidad:", err);
    res.status(500).json({ message: "Error al obtener tipos de recurso" });
  }
};

// Obtener un tipo de recurso específico
const getResourceType = async (req, res) => {
  try {
    const resourceType = await ResourceType.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          attributes: ["id", "name", "description"],
        },
      ],
    });

    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    res.json(resourceType);
  } catch (err) {
    console.error("Error al obtener tipo de recurso:", err);
    res.status(500).json({ message: "Error al obtener tipo de recurso" });
  }
};

// Actualizar un tipo de recurso
const updateResourceType = async (req, res) => {
  try {
    const resourceType = await ResourceType.findByPk(req.params.id);

    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const { name, unitId, granularity } = req.body;

    // Validar granularidad si se está actualizando
    if (granularity && (granularity < 15 || granularity > 480)) {
      return res.status(400).json({
        message: "La granularidad debe estar entre 15 y 480 minutos",
      });
    }

    // Si se está cambiando el nombre, verificar que no exista duplicado (case-insensitive) en la misma unidad
    if (name && name.toLowerCase() !== resourceType.name.toLowerCase()) {
      const existingResourceType = await ResourceType.findOne({
        where: {
          unitId: unitId || resourceType.unitId,
          name: {
            [Op.iLike]: name, // Case-insensitive comparison
          },
          id: {
            [Op.ne]: resourceType.id, // Excluir el registro actual
          },
        },
      });

      if (existingResourceType) {
        return res.status(400).json({
          message: `Ya existe un tipo de recurso con el nombre '${name}' en esta unidad`,
        });
      }
    }

    await resourceType.update({
      ...req.body,
      name: name ? name.trim() : resourceType.name,
    });

    res.json({
      message: "Tipo de recurso actualizado exitosamente",
      resourceType,
    });
  } catch (err) {
    console.error("Error al actualizar tipo de recurso:", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Ya existe un tipo de recurso con este nombre en la unidad",
      });
    }

    res.status(500).json({ message: err.message });
  }
};

// Eliminar un tipo de recurso (eliminación lógica)
const deleteResourceType = async (req, res) => {
  try {
    const resourceType = await ResourceType.findByPk(req.params.id);

    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    // Eliminación lógica en lugar de física
    await resourceType.update({ isActive: false });

    res.json({
      message: "Tipo de recurso desactivado correctamente",
    });
  } catch (err) {
    console.error("Error al eliminar tipo de recurso:", err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminación física de tipo de recurso (solo para administradores)
const destroyResourceType = async (req, res) => {
  try {
    const resourceType = await ResourceType.findByPk(req.params.id);

    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    // Verificar si tiene recursos asociados (cuando implementes HU-003)
    // if (resourceType.Resources && resourceType.Resources.length > 0) {
    //   return res.status(400).json({
    //     message: "No se puede eliminar el tipo de recurso porque tiene recursos asociados"
    //   });
    // }

    await resourceType.destroy();
    res.json({
      message: "Tipo de recurso eliminado permanentemente",
    });
  } catch (err) {
    console.error("Error al eliminar tipo de recurso:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createResourceType,
  getResourceTypes,
  getResourceTypesByUnit,
  getActiveResourceTypesByUnit,
  getResourceType,
  updateResourceType,
  deleteResourceType,
  destroyResourceType,
};
