const express = require("express");
const router = express.Router();
const {
  createUnit,
  getUnits,
  getUnit,
  updateUnit,
  deleteUnit,
  getUnitWithSchedules,
} = require("../views/unitController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// Rutas de unidades
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
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnit
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
router.get(
  "/:id/schedules",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUnitWithSchedules
);

module.exports = router;
