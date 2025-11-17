const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const ResourceType = require("./ResourceType");

const TypeSchedule = sequelize.define("TypeSchedule", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  dayOfWeek: {
    type: DataTypes.ENUM("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"),
    allowNull: false,
  },

  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },

  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  }
});

// RELACIÓN
ResourceType.hasMany(TypeSchedule, { foreignKey: "typeId", onDelete: "CASCADE" });
TypeSchedule.belongsTo(ResourceType, { foreignKey: "typeId" });

module.exports = TypeSchedule;
