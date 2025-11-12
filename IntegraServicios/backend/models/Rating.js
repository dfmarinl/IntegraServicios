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
  stars: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 5 },
  },
  comment: {
    type: DataTypes.TEXT,
  },
});

Reservation.hasOne(Rating, { foreignKey: "reservationId", onDelete: "CASCADE" });
Rating.belongsTo(Reservation, { foreignKey: "reservationId" });

User.hasMany(Rating, { foreignKey: "userId", onDelete: "CASCADE" });
Rating.belongsTo(User, { foreignKey: "userId" });

module.exports = Rating;
