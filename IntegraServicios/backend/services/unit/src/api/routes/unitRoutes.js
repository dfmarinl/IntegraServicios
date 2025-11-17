const express = require("express");
const router = express.Router();
const {
  createUnit,
  getUnits,
  updateUnit,
  deleteUnit,
} = require("../views/unitController");
const { verifyToken } = require("../../../../user/src/middleware/authentication");

router.post("/", createUnit);
router.get("/",  getUnits);
router.put("/:id", verifyToken, updateUnit);
router.delete("/:id", verifyToken, deleteUnit);

module.exports = router;
