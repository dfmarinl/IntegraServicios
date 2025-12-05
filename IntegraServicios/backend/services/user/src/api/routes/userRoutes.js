const express = require("express");
const router = express.Router();
const {
  verifyToken,
  authorizeRoles,
} = require("../../middleware/authentication");

const {
  createUser,
  getAllUsers,
  getUsersPages,
  getActiveUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
} = require("../views/userController");

// ORDEN CORRECTO (igual que unidades):
// 1. Rutas específicas SIN parámetros
router.get(
  "/paginado",
  verifyToken,
  authorizeRoles("administrador"),
  getUsersPages
);

router.get(
  "/active",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getActiveUsers
);

// 2. Rutas con parámetros
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUserById
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateUser
);

// 3. Nuevas rutas para activar/desactivar
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador"),
  deleteUser // ← Ahora es desactivar
);

router.put(
  "/:id/activate",
  verifyToken,
  authorizeRoles("administrador"),
  activateUser
);

// 4. Rutas generales
router.post(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  createUser
);

router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getAllUsers // ← Trae TODOS (activos e inactivos)
);

module.exports = router;
