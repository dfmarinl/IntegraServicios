const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Reservation = require("./Reservation");
const User = require("./user");

const Loan = sequelize.define("Loan", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  deliveryTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hasFailure: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Reservation.hasOne(Loan, { foreignKey: "reservationId", onDelete: "CASCADE" });
Loan.belongsTo(Reservation, { foreignKey: "reservationId" });

User.hasMany(Loan, { foreignKey: "employeeId", as: "LoansManaged" });
Loan.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

module.exports = Loan;
