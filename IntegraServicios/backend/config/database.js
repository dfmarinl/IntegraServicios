const { Sequelize } = require("sequelize");
require("dotenv").config({ path: "../.env" });

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

let sequelize;

if (process.env.DATABASE_URL) {
  // 🚂 CONEXIÓN A RAILWAY (producción)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Sin logs en producción
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  console.log("🚂 Conectando a Railway PostgreSQL...");
  
} else if (isProduction) {
  // 🚨 ERROR: Producción sin DATABASE_URL
  throw new Error("❌ DATABASE_URL requerida para producción");
  
} else {
  // 💻 CONEXIÓN LOCAL (desarrollo)
  sequelize = new Sequelize(
    process.env.DB_NAME || "IntegraServicios",
    process.env.DB_USER || "postgres",
    process.env.DB_PASS || "1235",
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 5432,
      dialect: "postgres",
      logging: console.log, // Ver queries en desarrollo
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
  console.log("💻 Conectando a PostgreSQL local...");
}

// Prueba de conexión
sequelize.authenticate()
  .then(() => {
    console.log(`✅ PostgreSQL conectado (${process.env.NODE_ENV || "development"})`);
  })
  .catch(err => {
    console.error("❌ Error de conexión:", err.message);
    if (isProduction) process.exit(1);
  });

module.exports = sequelize;

