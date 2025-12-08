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
    comment:
      "Indica si la devolución fue tardía (más de 5 min después del fin)",
  },
  hasDamage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
    comment: "Indica si el recurso presenta daños al momento de la devolución",
  },
});

Loan.hasOne(Return, { foreignKey: "loanId", onDelete: "CASCADE" });
Return.belongsTo(Loan, { foreignKey: "loanId" });

User.hasMany(Return, { foreignKey: "employeeId", as: "ReturnsManaged" });
Return.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

module.exports = Return;
