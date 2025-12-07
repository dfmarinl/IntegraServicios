const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Reservation = require("./Reservation");
const User = require("./user");

const Rating = sequelize.define("Rating", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Calificación de cumplimiento de horarios (0-5 estrellas)
  scheduleCompliance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
    },
  },
  // Calificación de calidad y estado del recurso (0-5 estrellas)
  resourceQuality: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
    },
  },
  // Calificación de amabilidad del personal (0-5 estrellas)
  staffKindness: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
    },
  },
  // Promedio de las 3 calificaciones
  averageStars: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

Reservation.hasOne(Rating, {
  foreignKey: "reservationId",
  onDelete: "CASCADE",
});
Rating.belongsTo(Reservation, { foreignKey: "reservationId" });

User.hasMany(Rating, { foreignKey: "userId", onDelete: "CASCADE" });
Rating.belongsTo(User, { foreignKey: "userId" });

module.exports = Rating;
