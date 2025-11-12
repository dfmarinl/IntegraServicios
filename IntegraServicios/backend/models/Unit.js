const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Unit = sequelize.define("Unit", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING,
  },
  globalStartTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "06:00:00",
  },
  globalEndTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: "23:00:00",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Unit;
