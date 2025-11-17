const Unit = require("../../../../../models/Unit");
const UnitSchedule = require("../../../../../models/UnitSchedule");

// =============================
//  Agregar horario a una unidad
// =============================
exports.addScheduleToUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { dayOfWeek, startTime, endTime } = req.body;

    // Verificar unidad
    const unit = await Unit.findByPk(unitId);
    if (!unit) return res.status(404).json({ message: "Unidad no encontrada" });

    // Validar que no exista otro día repetido en la unidad
    const exists = await UnitSchedule.findOne({ where: { unitId, dayOfWeek } });
    if (exists)
      return res.status(400).json({
        message: `Ya existe un horario registrado para el día ${dayOfWeek} en esta unidad`,
      });

    const schedule = await UnitSchedule.create({
      unitId,
      dayOfWeek,
      startTime,
      endTime,
    });

    res.status(201).json(schedule);

  } catch (err) {
    console.error("Error al agregar horario:", err);
    res.status(400).json({ message: err.message });
  }
};

// =============================
//  Obtener horarios de una unidad
// =============================
exports.getUnitSchedules = async (req, res) => {
  try {
    const { unitId } = req.params;

    const schedules = await UnitSchedule.findAll({ where: { unitId } });

    res.json(schedules);

  } catch (err) {
    console.error("Error al obtener horarios:", err);
    res.status(500).json({ message: "Error al obtener horarios" });
  }
};

// =============================
//  Actualizar un horario específico
// =============================
exports.updateUnitSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await UnitSchedule.findByPk(scheduleId);
    if (!schedule)
      return res.status(404).json({ message: "Horario no encontrado" });

    await schedule.update(req.body);

    res.json(schedule);

  } catch (err) {
    console.error("Error al actualizar horario:", err);
    res.status(400).json({ message: err.message });
  }
};

// =============================
//  Eliminar un horario específico
// =============================
exports.deleteUnitSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await UnitSchedule.findByPk(scheduleId);
    if (!schedule)
      return res.status(404).json({ message: "Horario no encontrado" });

    await schedule.destroy();

    res.json({ message: "Horario eliminado" });

  } catch (err) {
    console.error("Error al eliminar horario:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.addMultipleSchedules = async (req, res) => {
  try {
    const { unitId } = req.params;
    const schedules = req.body.schedules;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ message: "Debes enviar un arreglo de horarios" });
    }

    // Verificar unidad
    const unit = await Unit.findByPk(unitId);
    if (!unit) return res.status(404).json({ message: "Unidad no encontrada" });

    // Validar duplicados dentro del mismo array
    const daysSent = schedules.map(s => s.dayOfWeek);
    const duplicatesInArray = daysSent.filter(
      (d, i) => daysSent.indexOf(d) !== i
    );

    if (duplicatesInArray.length > 0) {
      return res.status(400).json({
        message: `El array contiene días repetidos: ${[...new Set(duplicatesInArray)].join(", ")}`
      });
    }

    // Validar duplicados ya existentes en BD
    const existing = await UnitSchedule.findAll({
      where: { unitId, dayOfWeek: daysSent }
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: `La unidad ya tiene horarios para: ${existing
          .map(e => e.dayOfWeek)
          .join(", ")}`
      });
    }

    // Agregar unitId a cada objeto
    const schedulesToCreate = schedules.map(s => ({
      ...s,
      unitId
    }));

    // Crear en batch
    const created = await UnitSchedule.bulkCreate(schedulesToCreate);

    res.status(201).json({
      message: "Horarios registrados correctamente",
      created
    });

  } catch (err) {
    console.error("Error al agregar horarios:", err);
    res.status(400).json({ message: err.message });
  }
};