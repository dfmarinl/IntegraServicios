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

const resourceRoutes = require("./services/user/src/api/routes/resourceRoutes");
const availabilityRoutes = require("./services/user/src/api/routes/availabilityRoutes");
const reservationRoutes = require("./services/user/src/api/routes/reservationRoutes");
const loanRoutes = require("./services/user/src/api/routes/loanRoutes");
const returnRoutes = require("./services/user/src/api/routes/returnRoutes");
const ratingRoutes = require("./services/user/src/api/routes/ratingRoutes");
const failureRoutes = require("./services/user/src/api/routes/failureRoutes");

const PORT = process.env.PORT || 3001;
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta base para verificar conexión
app.get("/", (req, res) => {
  res.send(
    "API de IntegraServicios funcionando correctamente en localhost 3001"
  );
});

// =====================
//   RUTAS DEL SISTEMA
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/unit-schedules", unitScheduleRoutes);
app.use("/api/type-schedules", typeScheduleRoutes);

app.use("/api/resource-types", resourceTypeRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/availabilities", availabilityRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/failures", failureRoutes);

// Export app for testing
module.exports = app;

// =====================
//  INICIAR SERVIDOR
// =====================
if (process.env.NODE_ENV !== "test") {
  sequelize.sync({ alter: true }).then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en el puerto ${PORT}`);
    });
  });
}
