const express = require("express");
const router = express.Router();
const {
  createReservation,
  getMyReservations,
  getReservation,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  getResourceReservations,
  getUserReservations,
  checkResourceAvailability,
  getResourceAvailability,
  getResourceAvailabilityRange
} = require("../views/reservationController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS DE DISPONIBILIDAD (NUEVAS) ==========

// Obtener disponibilidad de recurso para una fecha específica
router.get(
  "/resource/:resourceId/availability",
  verifyToken,
  getResourceAvailability
);

// Obtener disponibilidad de recurso para un rango de fechas
router.get(
  "/resource/:resourceId/availability-range",
  verifyToken,
  getResourceAvailabilityRange
);

// Verificar disponibilidad para un rango específico
router.post(
  "/check-availability",
  verifyToken,
  checkResourceAvailability
);

// ========== RUTAS EXISTENTES ==========

// Ruta de reservas por recurso
router.get(
  "/resource/:resourceId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getResourceReservations
);

// Ruta de reservas por usuario
router.get(
  "/user/:userId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getUserReservations
);

// Ruta de mis reservas
router.get(
  "/my-reservations",
  verifyToken,
  getMyReservations
);

// ========== RUTAS CON :id ==========

// Cancelar reserva
router.patch(
  "/:id/cancel",
  verifyToken,
  cancelReservation
);

// Actualizar estado de reserva
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateReservationStatus
);

// Obtener reserva específica
router.get(
  "/:id",
  verifyToken,
  getReservation
);

// ========== RUTAS SIN PARÁMETROS ==========

// Crear nueva reserva
router.post(
  "/",
  verifyToken,
  authorizeRoles("estudiante", "docente", "personal_administrativo"),
  createReservation
);

// Obtener todas las reservas (con filtros)
router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getAllReservations
);

module.exports = router;