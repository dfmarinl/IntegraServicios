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
  getUserById,
  updateUser,
  deleteUser,
} = require("../views/userController");

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
  getAllUsers
);

router.get(
  "/paginado",
  verifyToken,
  authorizeRoles("administrador"),
  getUsersPages
);

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

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  deleteUser
);

module.exports = router;
