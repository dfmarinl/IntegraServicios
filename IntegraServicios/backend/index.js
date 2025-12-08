require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const authRoutes = require("./services/user/src/api/routes/authRoutes");
const userRoutes = require("./services/user/src/api/routes/userRoutes");
const unitRoutes = require("./services/unit/src/api/routes/unitRoutes");
const resourceTypeRoutes = require("./services/resource/src/api/routes/resourceTypeRoutes");
const unitScheduleRoutes = require("./services/unit/src/api/routes/unitScheduleRoutes");
const typeScheduleRoutes = require("./services/resource/src/api/routes/typeScheduleRoutes");
const resourceRoutes = require("./services/resource/src/api/routes/resourceRoutes");
const reservationRoutes = require("./services/reservation/src/api/routes/reservationRoutes");
const reservationManagementRoutes = require("./services/reservation/src/api/routes/reservationManagementRoutes");
const loanRoutes = require("./services/loan/src/api/routes/loanRoutes");
const returnRoutes = require("./services/loan/src/api/routes/returnRoutes");
const ratingRoutes = require("./services/rating/src/api/routes/ratingRoutes");
const statsRoutes = require("./services/stats/src/api/routes/statsRoutes");
const publicRoutes = require("./services/resource/src/api/routes/publicRoute");
const availabilityRoutes = require("./services/user/src/api/routes/availabilityRoutes");
const failureRoutes = require("./services/user/src/api/routes/failureRoutes");

const PORT = process.env.PORT || 3001;
const app = express();

// =====================
//  CONFIGURACIÓN PARA RENDER + RAILWAY
// =====================
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

// 🔓 CORS COMPLETAMENTE ABIERTO (como solicitaste)
const corsOptions = {
  origin: "*", // Permite cualquier origen
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: "*", // Permite todos los headers
  exposedHeaders: ["Content-Length", "X-Request-ID"],
  credentials: false,
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 204
};

// Middlewares globales
app.use(cors(corsOptions)); 
app.use(express.json());

// =====================
//  HEALTH CHECK (OBLIGATORIO PARA RENDER)
// =====================
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    service: "IntegraServicios API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: "connected",
    cors: "open"
  });
});

// Ruta base
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API de IntegraServicios funcionando",
    environment: process.env.NODE_ENV || "development",
    status: "active",
    cors: "completely-open",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      units: "/api/units",
      resources: "/api/resources",
      reservations: "/api/reservations",
      loans: "/api/loans",
      ratings: "/api/ratings",
      stats: "/api/stats",
      health: "/health"
    },
    deployment: {
      backend: "Render.com",
      database: "Railway.app",
      timestamp: new Date().toISOString()
    }
  });
});

// =====================
//   RUTAS DEL SISTEMA
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/unit-schedules", unitScheduleRoutes);
app.use("/api/type-schedules", typeScheduleRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin/reservations", reservationManagementRoutes);
app.use("/api/resource-types", resourceTypeRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/availabilities", availabilityRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/failures", failureRoutes);

// =====================
//  MANEJO DE ERRORES PARA PRODUCCIÓN
// =====================
// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("🔴 Error:", err.message);
  
  const statusCode = err.statusCode || 500;
  const message = isProduction && statusCode === 500 
    ? "Error interno del servidor" 
    : err.message;
  
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack })
  });
});

// Export app for testing
module.exports = app;

// =====================
//  INICIAR SERVIDOR - VERSIÓN PARA RENDER
// =====================
if (require.main === module) {
  const startServer = async () => {
    try {
      console.log("🚀 Iniciando servidor...");
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 Puerto: ${PORT}`);
      
      // 1. Verificar conexión a la base de datos
      await sequelize.authenticate();
      console.log("✅ Conexión a PostgreSQL establecida");
      
      if (isProduction) {
        console.log("📡 Conectado a Railway PostgreSQL desde Render");
      } else {
        console.log("💻 Conectado a PostgreSQL local");
      }
      
      // 2. Sincronizar modelos (con precaución en producción)
      const syncOptions = isProduction 
        ? { alter: false } // ⚠️ EN PRODUCCIÓN: NO usar alter: true (usar migraciones)
        : { alter: true };  // ✅ EN DESARROLLO: está bien usar alter
      
      await sequelize.sync(syncOptions);
      console.log(`✅ Modelos sincronizados (alter: ${syncOptions.alter})`);
      
      // 3. Iniciar servidor
      const server = app.listen(PORT, () => {
        console.log(`
🎉 Servidor desplegado correctamente!
📍 URL Local: http://localhost:${PORT}
🌐 Health Check: http://localhost:${PORT}/health
🔓 CORS: Completamente abierto
📅 ${new Date().toLocaleString()}

📋 Información del despliegue:
   • Backend Host: Render.com
   • Database Host: Railway.app
   • Entorno: ${process.env.NODE_ENV || "development"}
   • Puerto: ${PORT}
        `);
      });
      
      // 4. Manejo de cierre limpio
      process.on("SIGTERM", () => {
        console.log("🛑 Recibida señal SIGTERM, cerrando servidor...");
        server.close(() => {
          console.log("✅ Servidor cerrado correctamente");
          sequelize.close();
          process.exit(0);
        });
      });
      
    } catch (error) {
      console.error("❌ Error crítico al iniciar servidor:", error.message);
      console.error("🔍 Detalles:", error);
      
      if (isProduction) {
        console.log("\n💡 Tips para solucionar problemas en Render:");
        console.log("1. Verifica DATABASE_URL en variables de entorno");
        console.log("2. Revisa que Railway PostgreSQL esté activo");
        console.log("3. Check logs en Render dashboard");
        console.log("4. Verifica puerto (Render usa 10000)");
      }
      
      process.exit(1);
    }
  };
  
  startServer();
}