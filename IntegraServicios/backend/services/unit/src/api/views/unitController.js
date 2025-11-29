const Unit = require("../../../../../models/Unit");

// Crear unidad
const createUnit = async (req, res) => {
  try {
    const { name, granularity } = req.body;

    // Validaciones
    if (!name) {
      return res.status(400).json({ message: "El nombre es requerido" });
    }

    if (granularity && granularity < 15) {
      return res
        .status(400)
        .json({ message: "La granularidad mínima es 15 minutos" });
    }

    const unit = await Unit.create(req.body);
    res.status(201).json(unit);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe una unidad con ese nombre" });
    }
    console.error("Error al crear unidad:", err);
    res.status(400).json({ message: err.message });
  }
};

// Obtener todas las unidades
const getUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      order: [
        ["isActive", "DESC"],
        ["name", "ASC"],
      ],
    });
    res.json(units);
  } catch (err) {
    console.error("Error al obtener unidades:", err);
    res.status(500).json({ message: "Error al obtener unidades" });
  }
};

// Obtener todas las unidades ACTIVAS (para frontend)
const getActiveUnits = async (req, res) => {
  try {
    const units = await Unit.findAll({
      where: { isActive: true },
      order: [["name", "ASC"]],
    });
    res.json(units);
  } catch (err) {
    console.error("Error al obtener unidades activas:", err);
    res.status(500).json({ message: "Error al obtener unidades activas" });
  }
};

// Obtener una unidad específica
const getUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }
    res.json(unit);
  } catch (err) {
    console.error("Error al obtener unidad:", err);
    res.status(500).json({ message: "Error al obtener unidad" });
  }
};

// Actualizar una unidad
const updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }

    const { granularity } = req.body;
    if (granularity && granularity < 15) {
      return res
        .status(400)
        .json({ message: "La granularidad mínima es 15 minutos" });
    }

    await unit.update(req.body);
    res.json(unit);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Ya existe una unidad con ese nombre" });
    }
    console.error("Error al actualizar unidad:", err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar una unidad (eliminación lógica)
const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
      include: ["ResourceTypes"],
    });

    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }

    // Verificar si tiene tipos de recurso asociados
    if (unit.ResourceTypes && unit.ResourceTypes.length > 0) {
      return res.status(400).json({
        message:
          "No se puede eliminar la unidad porque tiene tipos de recurso asociados",
      });
    }

    // Eliminación lógica en lugar de física
    await unit.update({ isActive: false });
    res.json({ message: "Unidad desactivada correctamente" });
  } catch (err) {
    console.error("Error al eliminar unidad:", err);
    res.status(500).json({ message: err.message });
  }
};

// Obtener unidades con sus horarios (para HU-001)
const getUnitWithSchedules = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
      include: ["UnitSchedules"],
    });

    if (!unit) {
      return res.status(404).json({ message: "Unidad no encontrada" });
    }

    res.json(unit);
  } catch (err) {
    console.error("Error al obtener unidad con horarios:", err);
    res.status(500).json({ message: "Error al obtener unidad" });
  }
};

// Get units with pagination (SOLO ACTIVAS)
const getUnitsPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: units } = await Unit.findAndCountAll({
      where: { isActive: true }, // ← FILTRO AGREGADO
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      units,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error al paginar unidades:", error);
    res.status(500).json({
      message: "Error al paginar unidades: " + error.message,
    });
  }
};

module.exports = {
  createUnit,
  getUnits,
  getActiveUnits,
  getUnit,
  updateUnit,
  deleteUnit,
  getUnitWithSchedules,
  getUnitsPaginated,
};
