const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");

// Crear tipo de recurso
const createResourceType = async (req, res) => {
  try {
    const { name, description, unitId } = req.body;

    // Validaciones
    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    if (!unitId) {
      return res
        .status(400)
        .json({ message: "El ID de la unidad es requerido" });
    }

    // Verificar que la unidad exista
    const unit = await Unit.findByPk(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }

    const resourceType = await ResourceType.create({
      name,
      description,
      unitId,
    });

    res.status(201).json(resourceType);
  } catch (err) {
    console.error("Error al crear tipo de recurso:", err);
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
          attributes: ["id", "name"],
        },
      ],
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

    const resourceTypes = await ResourceType.findAll({
      where: { unitId },
      include: [
        {
          model: Unit,
          attributes: ["id", "name"],
        },
      ],
    });

    res.json(resourceTypes);
  } catch (err) {
    console.error("Error al obtener tipos de recurso por unidad:", err);
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

    await resourceType.update(req.body);
    res.json(resourceType);
  } catch (err) {
    console.error("Error al actualizar tipo de recurso:", err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar un tipo de recurso
const deleteResourceType = async (req, res) => {
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
    res.json({ message: "Tipo de recurso eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar tipo de recurso:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createResourceType,
  getResourceTypes,
  getResourceTypesByUnit,
  getResourceType,
  updateResourceType,
  deleteResourceType,
};
