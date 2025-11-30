// models/ResourceType.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Unit = require("./Unit");

const ResourceType = sequelize.define(
  "ResourceType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre es requerido" },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    granularity: {
      type: DataTypes.INTEGER, // Minutos
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: {
          args: [15],
          msg: "La granularidad mínima es 15 minutos",
        },
        max: {
          args: [480],
          msg: "La granularidad máxima es 480 minutos (8 horas)",
        },
      },
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["unitId", "name"],
        name: "unique_resource_type_name_per_unit",
      },
    ],
    // Agregar collation para case-insensitive
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci", // Esta collation es case-insensitive
  }
);

// Relations
Unit.hasMany(ResourceType, { foreignKey: "unitId", onDelete: "CASCADE" });
ResourceType.belongsTo(Unit, { foreignKey: "unitId" });

module.exports = ResourceType;
