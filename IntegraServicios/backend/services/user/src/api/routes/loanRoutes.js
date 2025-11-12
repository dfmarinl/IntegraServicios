const express = require("express");
const router = express.Router();
const {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
} = require("../views/loanController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createLoan);
router.get("/", verifyToken, getLoans);
router.get("/:id", verifyToken, getLoanById);
router.put("/:id", verifyToken, updateLoan);
router.delete("/:id", verifyToken, deleteLoan);

module.exports = router;
