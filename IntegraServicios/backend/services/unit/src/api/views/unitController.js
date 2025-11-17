const Unit = require("../../../../../models/Unit");

// Crear unidad
exports.createUnit = async (req, res) => {
  try {
    const unit = await Unit.create(req.body);
    res.status(201).json(unit);
  } catch (err) {
    console.error("Error al crear unidad:", err);
    res.status(400).json({ message: err.message });
  }
};

// Obtener todas las unidades
exports.getUnits = async (req, res) => {
  try {
    const units = await Unit.findAll();
    res.json(units);
  } catch (err) {
    console.error("Error al obtener unidades:", err);
    res.status(500).json({ message: "Error al obtener unidades" });
  }
};

// Actualizar una unidad
exports.updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unidad no encontrada" });

    await unit.update(req.body);
    res.json(unit);
  } catch (err) {
    console.error("Error al actualizar unidad:", err);
    res.status(500).json({ message: err.message });
  }
};

// Eliminar una unidad
exports.deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unidad no encontrada" });

    await unit.destroy();
    res.json({ message: "Unidad eliminada" });
  } catch (err) {
    console.error("Error al eliminar unidad:", err);
    res.status(500).json({ message: err.message });
  }
};
