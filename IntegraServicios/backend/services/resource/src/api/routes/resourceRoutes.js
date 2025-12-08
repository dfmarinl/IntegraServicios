const express = require("express");
const router = express.Router();
const {
  createResource,
  getResources,
  getActiveResources,
  getResourcesPaginated,
  getResourcesByType,
  getActiveResourcesByType,
  getResource,
  updateResource,
  deleteResource,
  destroyResource,
  createMultipleResources,
} = require("../views/resourceController");
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
  getResourcesPaginated
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
  getActiveResources
);

// Rutas con parámetros de tipo (ANTES de /:id)
router.get(
  "/type/:typeId/active",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getActiveResourcesByType
);

router.get(
  "/type/:typeId",
  verifyToken,
  authorizeRoles(
    "administrador",
    "empleado_unidad",
    "docente",
    "personal_administrativo",
    "estudiante"
  ),
  getResourcesByType
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
  getResource
);

// ========== RUTAS SIN PARÁMETROS O CON BODY ==========

router.post(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  createResource
);

router.post(
  "/multiple",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  createMultipleResources
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
  getResources
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateResource
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteResource
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador"),
  destroyResource
);

module.exports = router;