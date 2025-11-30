// routes/typeScheduleRoutes.js
const express = require("express");
const router = express.Router();
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

const {
  addScheduleToType,
  getTypeSchedules,
  getCompleteTypeSchedule,
  updateTypeSchedule,
  deleteTypeSchedule,
  toggleDaySchedule,
  addMultipleSchedules,
  updateAllTypeSchedules,
} = require("../views/typeScheduleController");

// Rutas de horarios para tipos de recurso - MISMA ESTRUCTURA

// 1. Rutas ESPECÍFICAS primero
router.get(
  "/:typeId/schedules/complete",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getCompleteTypeSchedule
);

router.patch(
  "/:typeId/schedules/:dayOfWeek/toggle",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  toggleDaySchedule
);

// 2. Rutas con parámetros DESPUÉS
router.get(
  "/:typeId/schedules",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getTypeSchedules
);

router.post(
  "/:typeId/schedules/bulk",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  addMultipleSchedules
);

router.post(
  "/:typeId/schedules",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  addScheduleToType
);

// 3. Rutas con scheduleId
router.put(
  "/schedules/:scheduleId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateTypeSchedule
);

router.put(
  "/:typeId/schedules/bulk",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateAllTypeSchedules
);

router.delete(
  "/schedules/:scheduleId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteTypeSchedule
);

module.exports = router;