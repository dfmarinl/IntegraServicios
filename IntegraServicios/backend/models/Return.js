const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Loan = require("./Loan");
const User = require("./user");

const Return = sequelize.define("Return", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  returnTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  hasFailure: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Loan.hasOne(Return, { foreignKey: "loanId", onDelete: "CASCADE" });
Return.belongsTo(Loan, { foreignKey: "loanId" });

User.hasMany(Return, { foreignKey: "employeeId", as: "ReturnsManaged" });
Return.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

module.exports = Return;
