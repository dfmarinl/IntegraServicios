require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const PORT = process.env.PORT || 3001;
const authRoutes = require("./services/user/src/api/routes/authRoutes");
//const userRoutes = require("./services/user/src/api/routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send(
    "API de IntegraServicios funcionando correctamente en localhost 3001"
  );
});

// Routes
app.use("/api/auth", authRoutes);
//app.use("/api/pets", require("./routes/pets")); // ejemplo
//app.use("/api/users", userRoutes);

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
});
