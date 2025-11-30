const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Unit = sequelize.define("Unit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue("name", value.toLowerCase().trim());
    },
  },

  description: { type: DataTypes.TEXT },

  granularity: {
    type: DataTypes.INTEGER, // Minutos
    allowNull: false,
    defaultValue: 30,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Unit.associate = (models) => {
  Unit.hasMany(models.UnitSchedule, {
    foreignKey: "unitId",
    onDelete: "CASCADE",
    as: "schedules" 
  });
  Unit.hasMany(models.TypeResource, {
    foreignKey: "unitId",
    onDelete: "CASCADE",
  });
};

module.exports = Unit;
