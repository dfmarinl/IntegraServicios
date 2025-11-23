const express = require("express");
const router = express.Router();
const {
  createUnit,
  getUnits,
  getUnit,
  updateUnit,
  deleteUnit,
  getUnitWithSchedules,
  getUnitsPaginated,
} = require("../views/unitController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// Rutas de unidades - ORDEN CORREGIDO

// 1. Rutas ESPECÍFICAS primero
router.get(
  "/paginated",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnitsPaginated
);

// 2. Rutas con parámetros DESPUÉS
router.get(
  "/:id/schedules",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnitWithSchedules
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnit
);

// Las demás rutas se mantienen igual
router.post(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  createUnit
);
router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnits
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateUnit
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteUnit
);

module.exports = router;
