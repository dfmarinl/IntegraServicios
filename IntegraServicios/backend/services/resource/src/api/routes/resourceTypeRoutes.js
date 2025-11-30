const express = require("express");
const router = express.Router();
const {
  createResourceType,
  getResourceTypes,
  getActiveResourceTypes, // ← NUEVO
  getResourceTypesPaginated, // ← NUEVO
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

// ========== ORDEN CORRECTO: RUTAS ESPECÍFICAS PRIMERO ==========

// Ruta de paginación (ANTES de /:id)
router.get(
  "/paginated",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getResourceTypesPaginated
);

// Ruta de activos (ANTES de /:id)
router.get(
  "/active",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getActiveResourceTypes
);

// Rutas con parámetros de unidad (ANTES de /:id)
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

// ========== RUTAS CON :id AL FINAL ==========

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

// ========== RUTAS SIN PARÁMETROS O CON BODY ==========

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
