const express = require("express");
const router = express.Router();
const {
  createResource,
  getResources,
  getResourceById,
  updateResource,
  deleteResource,
} = require("../views/resourceController");
const { verifyToken } = require("../../middleware/authentication");

router.post("/", verifyToken, createResource);
router.get("/", verifyToken, getResources);
router.get("/:id", verifyToken, getResourceById);
router.put("/:id", verifyToken, updateResource);
router.delete("/:id", verifyToken, deleteResource);

module.exports = router;
