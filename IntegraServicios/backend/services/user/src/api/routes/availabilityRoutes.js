const express = require("express");
const router = express.Router();
const {
  createAvailability,
  getAvailabilities,
  updateAvailability,
  deleteAvailability,
} = require("../views/availabilityController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createAvailability);
router.get("/", verifyToken, getAvailabilities);
router.put("/:id", verifyToken, updateAvailability);
router.delete("/:id", verifyToken, deleteAvailability);

module.exports = router;
