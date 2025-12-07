const express = require("express");
const router = express.Router();
const reservationsStatsController = require("../views/statsController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS DE ESTADÍSTICAS DE RESERVAS ==========

/**
 * HU-012: Recursos más reservados
 * GET /api/reservations/stats/most-reserved
 * Query params:
 *   - startDate (required): Fecha de inicio del rango (ISO 8601)
 *   - endDate (required): Fecha de fin del rango (ISO 8601)
 *   - resourceTypeId (optional): ID del tipo de recurso para filtrar
 *   - limit (optional): Cantidad máxima de resultados (default: 10)
 */
router.get(
  "/most-reserved",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getMostReservedResources
);

/**
 * HU-013: Recurso más prestado
 * GET /api/reservations/stats/most-loaned
 * Query params:
 *   - startDate (optional): Fecha de inicio del rango (ISO 8601)
 *   - endDate (optional): Fecha de fin del rango (ISO 8601)
 */
router.get(
  "/most-loaned",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getMostLoanedResource
);

/**
 * HU-018: Reporte de calificaciones
 * GET /api/reservations/stats/ratings-report
 * Query params:
 *   - startDate (optional): Fecha de inicio del rango (ISO 8601)
 *   - endDate (optional): Fecha de fin del rango (ISO 8601)
 *   - resourceId (optional): ID del recurso para filtrar
 *   - employeeId (optional): ID del empleado para filtrar
 */
router.get(
  "/ratings-report",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getRatingsReport
);

/**
 * Resumen general de estadísticas de reservas
 * GET /api/reservations/stats/summary
 * Query params:
 *   - startDate (optional): Fecha de inicio del rango (ISO 8601)
 *   - endDate (optional): Fecha de fin del rango (ISO 8601)
 *   - resourceTypeId (optional): ID del tipo de recurso para filtrar
 */
router.get(
  "/summary",
  verifyToken,
  authorizeRoles("administrador"),
  reservationsStatsController.getReservationsStatsSummary
);

module.exports = router;
