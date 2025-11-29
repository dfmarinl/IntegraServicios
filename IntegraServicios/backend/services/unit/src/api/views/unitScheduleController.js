const Unit = require("../../../../../models/Unit");
const UnitSchedule = require("../../../../../models/UnitSchedule");

// Create schedule for a unit
const addScheduleToUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { dayOfWeek, startTime, endTime, isActive = true } = req.body;

    const unit = await Unit.findByPk(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const exists = await UnitSchedule.findOne({ where: { unitId, dayOfWeek } });
    if (exists) {
      return res.status(400).json({
        message: `Schedule already exists for ${dayOfWeek} in this unit`,
      });
    }

    const schedule = await UnitSchedule.create({
      unitId,
      dayOfWeek,
      startTime,
      endTime,
      isActive,
    });

    res.status(201).json(schedule);
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(400).json({ message: err.message });
  }
};

// Get all schedules for a unit
const getUnitSchedules = async (req, res) => {
  try {
    const { unitId } = req.params;
    const schedules = await UnitSchedule.findAll({
      where: { unitId },
      order: [["dayOfWeek", "ASC"]],
    });
    res.json(schedules);
  } catch (err) {
    console.error("Error fetching schedules:", err);
    res.status(500).json({ message: "Error fetching schedules" });
  }
};

// Get complete weekly schedule for a unit
const getCompleteUnitSchedule = async (req, res) => {
  try {
    const { unitId } = req.params;

    const schedules = await UnitSchedule.findAll({
      where: { unitId },
      order: [["dayOfWeek", "ASC"]],
    });

    const allDays = [
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
      "domingo",
    ];

    const completeSchedule = allDays.map((day) => {
      const existing = schedules.find((s) => s.dayOfWeek === day);
      return {
        dayOfWeek: day,
        startTime: existing?.startTime || null,
        endTime: existing?.endTime || null,
        isActive: existing ? existing.isActive : false,
        exists: !!existing,
        id: existing?.id || null,  // ← AÑADIR ESTA LÍNEA
      };
    });

    res.json(completeSchedule);
  } catch (err) {
    console.error("Error fetching complete schedule:", err);
    res.status(500).json({ message: "Error fetching schedule" });
  }
};

// Update specific schedule
const updateUnitSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await UnitSchedule.findByPk(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    await schedule.update(req.body);
    res.json(schedule);
  } catch (err) {
    console.error("Error updating schedule:", err);
    res.status(400).json({ message: err.message });
  }
};

// Delete specific schedule
const deleteUnitSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await UnitSchedule.findByPk(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    await schedule.destroy();
    res.json({ message: "Schedule deleted successfully" });
  } catch (err) {
    console.error("Error deleting schedule:", err);
    res.status(500).json({ message: err.message });
  }
};

// Toggle day schedule active status
const toggleDaySchedule = async (req, res) => {
  try {
    const { unitId, dayOfWeek } = req.params;
    const { isActive } = req.body;

    const schedule = await UnitSchedule.findOne({
      where: { unitId, dayOfWeek },
    });

    if (!schedule) {
      return res.status(404).json({
        message: "No schedule found for this day",
      });
    }

    await schedule.update({ isActive });
    res.json({
      message: `Day ${isActive ? "activated" : "deactivated"} successfully`,
      schedule,
    });
  } catch (err) {
    console.error("Error toggling day schedule:", err);
    res.status(400).json({ message: err.message });
  }
};

// Add multiple schedules at once
const addMultipleSchedules = async (req, res) => {
  try {
    const { unitId } = req.params;
    const schedules = req.body.schedules;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ message: "Schedules array is required" });
    }

    const unit = await Unit.findByPk(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const daysSent = schedules.map((s) => s.dayOfWeek);
    const duplicatesInArray = daysSent.filter(
      (d, i) => daysSent.indexOf(d) !== i
    );

    if (duplicatesInArray.length > 0) {
      return res.status(400).json({
        message: `Duplicate days in array: ${[
          ...new Set(duplicatesInArray),
        ].join(", ")}`,
      });
    }

    const existing = await UnitSchedule.findAll({
      where: { unitId, dayOfWeek: daysSent },
    });

    if (existing.length > 0) {
      return res.status(400).json({
        message: `Unit already has schedules for: ${existing
          .map((e) => e.dayOfWeek)
          .join(", ")}`,
      });
    }

    const schedulesToCreate = schedules.map((s) => ({
      ...s,
      unitId,
      isActive: s.isActive !== undefined ? s.isActive : true,
    }));

    const created = await UnitSchedule.bulkCreate(schedulesToCreate);

    res.status(201).json({
      message: "Schedules created successfully",
      created,
    });
  } catch (err) {
    console.error("Error creating multiple schedules:", err);
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  addScheduleToUnit,
  getUnitSchedules,
  getCompleteUnitSchedule,
  updateUnitSchedule,
  deleteUnitSchedule,
  toggleDaySchedule,
  addMultipleSchedules,
};
