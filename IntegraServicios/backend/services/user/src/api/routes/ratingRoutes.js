const express = require("express");
const router = express.Router();
const {
  createRating,
  getRatings,
  getRatingById,
  updateRating,
  deleteRating,
} = require("../views/ratingController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createRating);
router.get("/", verifyToken, getRatings);
router.get("/:id", verifyToken, getRatingById);
router.put("/:id", verifyToken, updateRating);
router.delete("/:id", verifyToken, deleteRating);

module.exports = router;
