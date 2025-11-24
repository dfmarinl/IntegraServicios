// models/UnitSchedule.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UnitSchedule = sequelize.define(
  "UnitSchedule",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // FK a Unit (asegúrate de que exista el modelo Unit)
    unitId: {
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
    // índice único para evitar duplicados (mismo día en la misma unidad)
    indexes: [
      {
        unique: true,
        fields: ["unitId", "dayOfWeek"],
        name: "ux_unit_schedule_unitid_dayofweek",
      },
    ],
    // validaciones a nivel de modelo
    validate: {
      startBeforeEnd() {
        // startTime / endTime vienen como 'HH:MM:SS' (strings). Comparación lexicográfica funciona para formato 24h.
        if (!this.startTime || !this.endTime) return;
        if (this.startTime >= this.endTime) {
          throw new Error("startTime debe ser menor que endTime");
        }
      },
    },
  }
);

// Declarar asociación a Unit usando una función associate que el index de modelos puede invocar
UnitSchedule.associate = (models) => {
  UnitSchedule.belongsTo(models.Unit, {
    foreignKey: "unitId",
    onDelete: "CASCADE",
    as: "unit",
  });

  // (opcional) si quieres acceso inverso desde Unit:
  // models.Unit.hasMany(UnitSchedule, { foreignKey: "unitId", as: "schedules" });
};

module.exports = UnitSchedule;
