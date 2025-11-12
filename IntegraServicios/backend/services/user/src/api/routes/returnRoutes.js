const express = require("express");
const router = express.Router();
const {
  createReturn,
  getReturns,
  getReturnById,
  updateReturn,
  deleteReturn,
} = require("../views/returnController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createReturn);
router.get("/", verifyToken, getReturns);
router.get("/:id", verifyToken, getReturnById);
router.put("/:id", verifyToken, updateReturn);
router.delete("/:id", verifyToken, deleteReturn);

module.exports = router;
