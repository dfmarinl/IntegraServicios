const express = require("express");
const router = express.Router();
const {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  deleteReservation,
} = require("../views/reservationController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createReservation);
router.get("/", verifyToken, getReservations);
router.get("/:id", verifyToken, getReservationById);
router.put("/:id", verifyToken, updateReservation);
router.put("/:id/cancel", verifyToken, cancelReservation);
router.delete("/:id", verifyToken, deleteReservation);

module.exports = router;
