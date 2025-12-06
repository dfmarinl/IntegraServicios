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
  getResourceAvailabilityRange,
  checkRepeatAvailability, // 🆕 Nueva función
  getRepeatSeries, // 🆕 Nueva función
} = require("../views/reservationController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS DE DISPONIBILIDAD ==========

// Verificar disponibilidad para un rango específico (reserva única)
router.post("/check-availability", verifyToken, checkResourceAvailability);

// 🆕 Verificar disponibilidad para reserva repetitiva
router.post(
  "/check-repeat-availability",
  verifyToken,
  authorizeRoles("estudiante", "docente", "personal_administrativo"),
  checkRepeatAvailability
);

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

// ========== RUTAS PARA SERIES REPETITIVAS ==========

// 🆕 Obtener todas mis series de reservas repetitivas
router.get("/repeat-series/my", verifyToken, getRepeatSeries);

// 🆕 Obtener todas las series repetitivas (admin/empleados)
router.get(
  "/repeat-series/all",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getRepeatSeries
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
router.get("/my-reservations", verifyToken, getMyReservations);

// ========== RUTAS CON :id ==========

// Cancelar reserva (ahora soporta cancelAll y cancelFuture)
router.patch("/:id/cancel", verifyToken, cancelReservation);

// Actualizar estado de reserva
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  updateReservationStatus
);

// Obtener reserva específica (ahora incluye info de serie repetitiva si aplica)
router.get("/:id", verifyToken, getReservation);

// ========== RUTAS SIN PARÁMETROS ==========

// Crear nueva reserva (ahora soporta repetitivas)
router.post(
  "/",
  verifyToken,
  authorizeRoles("estudiante", "docente", "personal_administrativo"),
  createReservation
);

// Obtener todas las reservas (con filtros, ahora incluye filtro por isRepetitive)
router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  getAllReservations
);

module.exports = router;
