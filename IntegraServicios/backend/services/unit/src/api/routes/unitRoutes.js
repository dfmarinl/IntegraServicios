const express = require("express");
const router = express.Router();
const {
  createUnit,
  getUnits,
  updateUnit,
  deleteUnit,
} = require("../views/unitController");
const { verifyToken } = require("../../../../user/src/middleware/authentication");

router.post("/", verifyToken, createUnit);
router.get("/", verifyToken, getUnits);
router.put("/:id", verifyToken, updateUnit);
router.delete("/:id", verifyToken, deleteUnit);

module.exports = router;
