const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const ResourceType = require("./ResourceType");

const Availability = sequelize.define("Availability", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dayOfWeek: {
    type: DataTypes.INTEGER, // 0=Lunes ... 6=Domingo
    allowNull: false,
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
});

ResourceType.hasMany(Availability, { foreignKey: "typeId", onDelete: "CASCADE" });
Availability.belongsTo(ResourceType, { foreignKey: "typeId" });

module.exports = Availability;
