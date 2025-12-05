// helpers/availabilityHelper.js
const { Op } = require('sequelize');
const models = require('../models');

/**
 * Verifica si un recurso está disponible en un horario específico
 */
const checkResourceAvailability = async (resourceId, startDateTime, endDateTime, excludeReservationId = null) => {
  try {
    const whereConditions = {
      resourceId,
      status: {
        [Op.notIn]: ['cancelada'] // Solo reservas activas
      },
      [Op.or]: [
        // CUALQUIER solapamiento
        {
          startDateTime: { [Op.lt]: endDateTime },
          endDateTime: { [Op.gt]: startDateTime }
        }
      ]
    };

    // Excluir una reserva específica (para ediciones)
    if (excludeReservationId) {
      whereConditions.id = { [Op.ne]: excludeReservationId };
    }

    const existingReservation = await models.Reservation.findOne({
      where: whereConditions
    });

    return {
      isAvailable: !existingReservation,
      conflictingReservation: existingReservation
    };
  } catch (error) {
    console.error('Error en checkResourceAvailability:', error);
    throw new Error('Error al verificar disponibilidad');
  }
};

module.exports = {
  checkResourceAvailability
};