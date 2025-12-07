const express = require("express");
const router = express.Router();
const ratingController = require("../views/ratingController");
const {
  verifyToken,
  authorizeRoles,
} = require("../../../../user/src/middleware/authentication");

// ========== RUTAS PÚBLICAS Y PAGINADAS ==========

// Obtener calificaciones paginadas (admin y empleados)
router.get(
  "/paginated",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  ratingController.getRatingsPaginated
);

// Obtener estadísticas de calificaciones (admin y empleados)
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  ratingController.getRatingStats
);

// ========== RUTAS CON PARÁMETROS ==========

// Obtener calificaciones por reserva
router.get(
  "/reservation/:reservationId",
  verifyToken,
  ratingController.getRatingsByReservation
);

// Obtener calificaciones por usuario
router.get(
  "/user/:userId",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  ratingController.getRatingsByUser
);

// Obtener calificaciones por recurso
router.get(
  "/resource/:resourceId",
  verifyToken,
  ratingController.getRatingsByResource
);

// Obtener una calificación específica
router.get("/:id", verifyToken, ratingController.getRating);

// ========== RUTAS DE OPERACIONES ==========

// Crear una nueva calificación (cualquier usuario registrado puede calificar sus reservas)
router.post("/", verifyToken, ratingController.createRating);

// Obtener todas las calificaciones (admin y empleados)
router.get(
  "/",
  verifyToken,
  authorizeRoles("administrador", "empleado_unidad"),
  ratingController.getRatings
);

// Actualizar una calificación (el usuario que la creó o admin)
router.put("/:id", verifyToken, ratingController.updateRating);

// Eliminar una calificación (solo admin)
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("administrador"),
  ratingController.deleteRating
);

module.exports = router;
