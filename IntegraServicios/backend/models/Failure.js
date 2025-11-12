const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Loan = require("./Loan");

const Failure = sequelize.define("Failure", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pendiente", "resuelto"),
    defaultValue: "pendiente",
  },
});

Loan.hasMany(Failure, { foreignKey: "loanId", onDelete: "CASCADE" });
Failure.belongsTo(Loan, { foreignKey: "loanId" });

module.exports = Failure;
