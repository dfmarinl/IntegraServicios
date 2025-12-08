// routes/publicRoutes.js
const express = require("express");
const router = express.Router();
const { getPublicIntegrationResources } = require("../views/publicIntegrationController");

// Ruta pública principal de integración
router.get("/integration/resources", getPublicIntegrationResources);

// Opcional: Ruta de health check pública
router.get("/status", (req, res) => {
  res.json({
    service: "API Pública de Integración",
    status: "active",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      integration: "/api/public/integration/resources"
    }
  });
});

module.exports = router;