const express = require("express");
const router = express.Router();
const {
  createResourceType,
  getResourceTypes,
  getResourceTypesByUnit,
  getResourceType,
  updateResourceType,
  deleteResourceType,
} = require("../views/resourceTypeController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// Rutas de tipos de recurso
router.post(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  createResourceType
);
router.get(
  "/",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getResourceTypes
);
router.get(
  "/unit/:unitId",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getResourceTypesByUnit
);
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getResourceType
);
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateResourceType
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteResourceType
);

module.exports = router;
