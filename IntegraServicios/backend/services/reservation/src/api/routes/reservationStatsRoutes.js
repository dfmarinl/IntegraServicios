const express = require("express");
const router = express.Router();
const reservationsStatsController = require("../views/reservationStatsController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS DE ESTADÍSTICAS DE RESERVAS (HU-012) ==========

/**
 * RF6: Consultar los recursos más reservados por tipo de recurso
 * GET /api/reservations/stats/most-reserved
 * Query params:
 *   - startDate (required): Fecha de inicio del rango (ISO 8601)
 *   - endDate (required): Fecha de fin del rango (ISO 8601)
 *   - resourceTypeId (optional): ID del tipo de recurso para filtrar
 *   - limit (optional): Cantidad máxima de resultados (default: 10)
 *
 * Ejemplo: /api/reservations/stats/most-reserved?startDate=2025-01-01&endDate=2025-12-31&resourceTypeId=1&limit=5
 */
router.get(
  "/most-reserved",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getMostReservedResourcesByType
);

/**
 * RF7: Obtener el recurso con mayor número de préstamos realizados
 * GET /api/reservations/stats/most-loaned
 * Query params:
 *   - startDate (optional): Fecha de inicio del rango (ISO 8601)
 *   - endDate (optional): Fecha de fin del rango (ISO 8601)
 *
 * Ejemplo: /api/reservations/stats/most-loaned?startDate=2025-01-01&endDate=2025-12-31
 */
router.get(
  "/most-loaned",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getResourceWithMostLoans
);

/**
 * Resumen general de estadísticas de reservas
 * GET /api/reservations/stats/summary
 * Query params:
 *   - startDate (optional): Fecha de inicio del rango (ISO 8601)
 *   - endDate (optional): Fecha de fin del rango (ISO 8601)
 *   - resourceTypeId (optional): ID del tipo de recurso para filtrar
 *
 * Ejemplo: /api/reservations/stats/summary?startDate=2025-01-01&endDate=2025-12-31
 */
router.get(
  "/summary",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getReservationsStatsSummary
);

module.exports = router;
