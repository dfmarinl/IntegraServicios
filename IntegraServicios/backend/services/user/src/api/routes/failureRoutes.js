const express = require("express");
const router = express.Router();
const {
  createFailure,
  getFailures,
  getFailureById,
  updateFailure,
  deleteFailure,
} = require("../views/failureController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createFailure);
router.get("/", verifyToken, getFailures);
router.get("/:id", verifyToken, getFailureById);
router.put("/:id", verifyToken, updateFailure);
router.delete("/:id", verifyToken, deleteFailure);

module.exports = router;
