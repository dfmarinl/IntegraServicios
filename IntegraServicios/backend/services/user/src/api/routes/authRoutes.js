const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  verifyCurrentPassword,
  updatePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../views/authController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, getMe);
router.post("/verify-password", verifyToken, verifyCurrentPassword);
router.post("/update-password", verifyToken, updatePassword);
router.post("/update-profile", verifyToken, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
