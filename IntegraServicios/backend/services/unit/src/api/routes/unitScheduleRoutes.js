const express = require("express");
const router = express.Router();
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

const {
  addScheduleToUnit,
  getUnitSchedules,
  getCompleteUnitSchedule,
  updateUnitSchedule,
  deleteUnitSchedule,
  toggleDaySchedule,
  addMultipleSchedules,
  updateAllUnitSchedules,
} = require("../views/unitScheduleController");

// Rutas de horarios - ORDEN CORREGIDO

// 1. Rutas ESPECÍFICAS primero
router.get(
  "/:unitId/schedules/complete",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getCompleteUnitSchedule
);

router.patch(
  "/:unitId/schedules/:dayOfWeek/toggle",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  toggleDaySchedule
);

// 2. Rutas con parámetros DESPUÉS
router.get(
  "/:unitId/schedules",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnitSchedules
);

router.post(
  "/:unitId/schedules/bulk",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  addMultipleSchedules
);

router.post(
  "/:unitId/schedules",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  addScheduleToUnit
);

// 3. Rutas con scheduleId
router.put(
  "/schedules/:scheduleId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateUnitSchedule
);

router.put(
  "/:unitId/schedules/bulk",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateAllUnitSchedules
);

router.delete(
  "/schedules/:scheduleId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteUnitSchedule
);

module.exports = router;
