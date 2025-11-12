const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const Sanction = sequelize.define("Sanction", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATE,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

User.hasMany(Sanction, { foreignKey: "userId", onDelete: "CASCADE" });
Sanction.belongsTo(User, { foreignKey: "userId" });

module.exports = Sanction;
