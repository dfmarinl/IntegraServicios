const express = require("express");
const router = express.Router();
const {
  createResourceType,
  getResourceTypes,
  getResourceTypesByUnit,
  getActiveResourceTypesByUnit,
  getResourceType,
  updateResourceType,
  deleteResourceType,
  destroyResourceType,
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
  "/unit/:unitId/active",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getActiveResourceTypesByUnit
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
router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteResourceType
);
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador"),
  destroyResourceType
);

module.exports = router;
