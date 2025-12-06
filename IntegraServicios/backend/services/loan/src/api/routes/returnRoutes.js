const express = require("express");
const router = express.Router();
const returnController = require("../views/returnController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS PÚBLICAS Y PAGINADAS ==========

// Obtener devoluciones paginadas (admin y empleados)
router.get(
  "/paginated",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.getReturnsPaginated
);

// Obtener estadísticas de devoluciones (admin)
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.getReturnStats
);

// ========== RUTAS CON PARÁMETROS ==========

// Obtener devoluciones por préstamo
router.get(
  "/loan/:loanId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.getReturnsByLoan
);

// Obtener devoluciones por empleado
router.get(
  "/employee/:employeeId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.getReturnsByEmployee
);

// Verificar si existe devolución para un préstamo
router.get(
  "/check/:loanId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.checkReturnExists
);

// Obtener una devolución específica
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.getReturn
);

// ========== RUTAS DE OPERACIONES ==========

// Crear una nueva devolución (registrar recepción)
router.post(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.createReturn
);

// Obtener todas las devoluciones
router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.getReturns
);

// Actualizar una devolución
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  returnController.updateReturn
);

// Eliminar una devolución
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador"),
  returnController.deleteReturn
);

module.exports = router;
