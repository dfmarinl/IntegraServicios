const express = require("express");
const router = express.Router();
const loanController = require("../views/loanController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS PÚBLICAS Y PAGINADAS ==========

// Obtener préstamos paginados (admin y empleados)
router.get(
  "/paginated",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.getLoansPaginated
);

// Obtener estadísticas de préstamos (admin)
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.getLoanStats
);

// ========== RUTAS CON PARÁMETROS ==========

// Obtener préstamos por reserva
router.get(
  "/reservation/:reservationId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.getLoansByReservation
);

// Obtener préstamos por empleado
router.get(
  "/employee/:employeeId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.getLoansByEmployee
);

// Obtener un préstamo específico
router.get(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.getLoan
);

// ========== RUTAS DE OPERACIONES ==========

// Crear un nuevo préstamo (registrar entrega)
router.post(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.createLoan
);

// Obtener todos los préstamos
router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.getLoans
);

// Actualizar un préstamo
router.put(
  "/:id",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  loanController.updateLoan
);

// Eliminar un préstamo
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador"),
  loanController.deleteLoan
);

module.exports = router;
