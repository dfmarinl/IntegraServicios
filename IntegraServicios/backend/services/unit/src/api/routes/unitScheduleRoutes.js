const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../../../user/src/middleware/authentication");

const {
  addScheduleToUnit,
  getUnitSchedules,
  updateUnitSchedule,
  deleteUnitSchedule,
    addMultipleSchedules,
} = require("../views/unitScheduleController");

// Registrar horario para una unidad
router.post("/:unitId/schedules",  addScheduleToUnit);

router.post("/:unitId/schedules/bulk", addMultipleSchedules);


// Obtener los horarios de una unidad
router.get("/:unitId/schedules",  getUnitSchedules);

// Actualizar un horario específico
router.put("/schedules/:scheduleId", verifyToken, updateUnitSchedule);

// Eliminar un horario específico
router.delete("/schedules/:scheduleId", verifyToken, deleteUnitSchedule);

module.exports = router;
