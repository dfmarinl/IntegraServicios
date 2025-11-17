const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UnitSchedule = sequelize.define("UnitSchedule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  dayOfWeek: {
    type: DataTypes.ENUM("lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"),
    allowNull: false,
  },

  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
});

UnitSchedule.associate = (models) => {
  UnitSchedule.belongsTo(models.Unit, { foreignKey: "unitId" });
};

module.exports = UnitSchedule;

