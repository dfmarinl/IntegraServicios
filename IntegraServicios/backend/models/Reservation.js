const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Resource = require("./Resource");
const User = require("./user");

const Reservation = sequelize.define("Reservation", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  startDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pendiente", "activa", "finalizada", "cancelada"),
    defaultValue: "pendiente",
  },
  isRepetitive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

User.hasMany(Reservation, { foreignKey: "userId", onDelete: "CASCADE" });
Reservation.belongsTo(User, { foreignKey: "userId" });

Resource.hasMany(Reservation, { foreignKey: "resourceId", onDelete: "CASCADE" });
Reservation.belongsTo(Resource, { foreignKey: "resourceId" });

module.exports = Reservation;
