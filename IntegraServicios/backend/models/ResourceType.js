const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Unit = require("./Unit");

const ResourceType = sequelize.define("ResourceType", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.STRING,
  }
});

// Relations
Unit.hasMany(ResourceType, { foreignKey: "unitId", onDelete: "CASCADE" });
ResourceType.belongsTo(Unit, { foreignKey: "unitId" });

module.exports = ResourceType;

