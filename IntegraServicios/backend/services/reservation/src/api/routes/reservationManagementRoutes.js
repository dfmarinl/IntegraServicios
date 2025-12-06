const express = require("express");
const router = express.Router();
const reservationManagementController = require("../views/reservationManagementController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS DE DASHBOARD Y ESTADÍSTICAS ==========

// Dashboard general de reservas
router.get(
  "/dashboard",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.getReservationDashboard
);

// ========== RUTAS DE GESTIÓN COMPLETA DE RESERVAS ==========

// Obtener todas las reservas con detalles completos (admin)
router.get(
  "/all-detailed",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.getAllReservationsWithDetails
);

// Obtener reservas activas para gestión de préstamos
router.get(
  "/active-for-loans",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.getActiveReservationsForLoans
);

// Obtener detalles completos de una reserva específica
router.get(
  "/:id/details",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.getReservationDetails
);

// Actualizar reserva (admin - edición completa)
router.put(
  "/:id/update",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.updateReservation
);

// Eliminar reserva (admin - con justificación)
router.delete(
  "/:id/delete",
  verifyToken,
  authorizeRoles("administrador"),
  reservationManagementController.deleteReservation
);

// ========== RUTAS PARA SERIES REPETITIVAS (ADMIN) ==========

// Gestionar series de reservas repetitivas
router.put(
  "/repeat-series/:seriesId/manage",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.manageRepeatSeries
);

// ========== RUTAS DE BÚSQUEDA AVANZADA ==========

// Búsqueda avanzada de reservas
router.get(
  "/search/advanced",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.searchReservations
);

// ========== RUTAS DE REPORTES Y ESTADÍSTICAS ==========

// Generar reportes de reservas
router.get(
  "/reports/generate",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  reservationManagementController.generateReservationsReport
);

// ========== RUTAS DE OPERACIONES MASIVAS ==========

// Actualización masiva de reservas
router.put(
  "/bulk/update",
  verifyToken,
  authorizeRoles("administrador"),
  reservationManagementController.bulkUpdateReservations
);

module.exports = router;
