// helpers/index.js - Para exportar todos los helpers
const { checkResourceAvailability } = require('./availabilityHelper');
const { generateAvailableSlots } = require('./slotGenerator');

module.exports = {
  checkResourceAvailability,
  generateAvailableSlots
};