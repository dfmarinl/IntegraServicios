const sequelize = require("../config/database"); //probably remove
const User = require("./user");

// =============== RELATIONSHIPS ===================

// ==============================================

module.exports = {
  sequelize,
  User,
};
