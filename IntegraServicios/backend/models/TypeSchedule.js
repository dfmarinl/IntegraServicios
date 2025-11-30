// models/TypeSchedule.js (ya está bien)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TypeSchedule = sequelize.define(
  "TypeSchedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    typeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    dayOfWeek: {
      type: DataTypes.ENUM(
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo"
      ),
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
    
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["typeId", "dayOfWeek"],
        name: "ux_type_schedule_typeid_dayofweek",
      },
    ],
    validate: {
      startBeforeEnd() {
        if (!this.startTime || !this.endTime) return;
        if (this.startTime >= this.endTime) {
          throw new Error("startTime debe ser menor que endTime");
        }
      },
    },
  }
);

// Declarar asociación a ResourceType
TypeSchedule.associate = (models) => {
  TypeSchedule.belongsTo(models.ResourceType, {
    foreignKey: "typeId",
    onDelete: "CASCADE",
    as: "resourceType",
  });
};

module.exports = TypeSchedule;