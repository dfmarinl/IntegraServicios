const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const ResourceType = require("./ResourceType");

const Resource = sequelize.define("Resource", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  features: {
    type: DataTypes.JSON,
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

ResourceType.hasMany(Resource, { foreignKey: "typeId", onDelete: "CASCADE" });
Resource.belongsTo(ResourceType, { foreignKey: "typeId" });

module.exports = Resource;
