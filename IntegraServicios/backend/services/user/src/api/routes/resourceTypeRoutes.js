const express = require("express");
const router = express.Router();
const {
  createResourceType,
  getResourceTypes,
  updateResourceType,
  deleteResourceType,
} = require("../views/resourceTypeController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createResourceType);
router.get("/", verifyToken, getResourceTypes);
router.put("/:id", verifyToken, updateResourceType);
router.delete("/:id", verifyToken, deleteResourceType);

module.exports = router;
