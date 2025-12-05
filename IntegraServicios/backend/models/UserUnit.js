// models/UserUnit.js (o UsuarioUnidad.js)
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserUnit = sequelize.define(
  "UserUnit",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    role: {
      type: DataTypes.ENUM(
        "administrador_unidad",
        "coordinador",
        "auxiliar",
        "tecnico",
        "vigilante"
      ),
      allowNull: false,
      defaultValue: "auxiliar",
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "user_units",
    timestamps: true, // createdAt, updatedAt
    indexes: [
      {
        unique: true,
        fields: ["userId", "unitId"],
        name: "unique_user_unit_assignment",
        where: { isActive: true }, // Índice parcial para asignaciones activas únicas
      },
    ],
  }
);

UserUnit.associate = (models) => {
  UserUnit.belongsTo(models.User, { foreignKey: "userId" });
  UserUnit.belongsTo(models.Unit, { foreignKey: "unitId" });
};

module.exports = UserUnit;
