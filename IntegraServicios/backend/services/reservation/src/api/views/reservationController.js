const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const User = require("../../../../../models/user");
const TypeSchedule = require("../../../../../models/TypeSchedule");
const { Op } = require("sequelize");
const { generateAvailableSlots } = require("../../../../../helpers/slotGenerator");

// ========== FUNCIONES DE VALIDACIÓN SIN INCLUDE ==========

// Función para validar horarios SIN INCLUDE
const validateTimeAgainstSchedule = async (resourceId, startDateTime, endDateTime) => {
  try {
    console.log('🔍 Validando horario para recurso:', resourceId);

    // Obtener datos por separado - SIN INCLUDE
    const resource = await Resource.findByPk(resourceId);
    if (!resource) {
      return { isValid: false, message: 'Recurso no encontrado' };
    }

    const resourceType = await ResourceType.findByPk(resource.typeId);
    if (!resourceType) {
      return { isValid: false, message: 'Tipo de recurso no encontrado' };
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const dayOfWeek = startDate.getDay();
    
    const dayMap = {
      0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 
      4: 'jueves', 5: 'viernes', 6: 'sabado'
    };
    
    const targetDay = dayMap[dayOfWeek];

    // Buscar schedule para este día - SIN INCLUDE
    const scheduleForDay = await TypeSchedule.findOne({
      where: { 
        typeId: resourceType.id, 
        dayOfWeek: targetDay,
        isActive: true 
      }
    });

    if (!scheduleForDay) {
      return { 
        isValid: false, 
        message: 'El recurso no está disponible los ' + targetDay + 's' 
      };
    }

    // Convertir horarios
    const dateStr = startDate.toISOString().split('T')[0];
    const scheduleStart = new Date(`${dateStr}T${scheduleForDay.startTime}`);
    const scheduleEnd = new Date(`${dateStr}T${scheduleForDay.endTime}`);

    // Extraer solo la hora de la reserva
    const reservationStartTime = new Date(startDate);
    reservationStartTime.setFullYear(scheduleStart.getFullYear(), scheduleStart.getMonth(), scheduleStart.getDate());
    
    const reservationEndTime = new Date(endDate);
    reservationEndTime.setFullYear(scheduleEnd.getFullYear(), scheduleEnd.getMonth(), scheduleEnd.getDate());

    // Validaciones
    if (reservationStartTime < scheduleStart) {
      return {
        isValid: false,
        message: `La reserva no puede comenzar antes de las ${scheduleForDay.startTime}`
      };
    }

    if (reservationEndTime > scheduleEnd) {
      return {
        isValid: false,
        message: `La reserva no puede terminar después de las ${scheduleForDay.endTime}`
      };
    }

    // Validar granularidad
    const granularity = resourceType.granularity || 30;
    const durationMs = endDate - startDate;
    const durationMinutes = durationMs / (1000 * 60);
    
    if (durationMinutes % granularity !== 0) {
      return {
        isValid: false,
        message: `La duración de la reserva debe ser múltiplo de ${granularity} minutos`
      };
    }

    const startMinutes = startDate.getMinutes();
    if (startMinutes % granularity !== 0) {
      return {
        isValid: false,
        message: `La hora de inicio debe ser en intervalos de ${granularity} minutos`
      };
    }

    return { isValid: true };

  } catch (error) {
    console.error('❌ Error en validateTimeAgainstSchedule:', error);
    return { isValid: false, message: 'Error al validar horario' };
  }
};

// Helper para verificar disponibilidad
const checkResourceAvailability = async (resourceId, startDateTime, endDateTime) => {
  const conflictingReservation = await Reservation.findOne({
    where: {
      resourceId,
      status: {
        [Op.in]: ['pendiente', 'activa']
      },
      [Op.or]: [
        {
          startDateTime: {
            [Op.between]: [startDateTime, endDateTime]
          }
        },
        {
          endDateTime: {
            [Op.between]: [startDateTime, endDateTime]
          }
        },
        {
          [Op.and]: [
            { startDateTime: { [Op.lte]: startDateTime } },
            { endDateTime: { [Op.gte]: endDateTime } }
          ]
        }
      ]
    }
  });

  return {
    isAvailable: !conflictingReservation,
    conflictingReservation: conflictingReservation || null
  };
};

// ========== CONTROLADORES PRINCIPALES SIN INCLUDE ==========

// Crear nueva reserva
const createReservation = async (req, res) => {
  try {
    const {
      resourceId,
      startDateTime,
      endDateTime,
      purpose,
      attendees = 1,
      isRepetitive = false
    } = req.body;

    const userId = req.user.id;

    // Validaciones básicas
    if (!resourceId || !startDateTime || !endDateTime || !purpose) {
      return res.status(400).json({ 
        message: "Faltan campos requeridos: resourceId, startDateTime, endDateTime, purpose" 
      });
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    
    if (startDate >= endDate) {
      return res.status(400).json({ 
        message: "La fecha de inicio debe ser anterior a la fecha de fin" 
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ 
        message: "No se pueden crear reservas en el pasado" 
      });
    }

    // Verificar recurso - SIN INCLUDE
    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true,
        isAvailable: true
      }
    });

    if (!resource) {
      return res.status(404).json({ 
        message: "Recurso no encontrado o no disponible" 
      });
    }

    // Validar horario
    const scheduleValidation = await validateTimeAgainstSchedule(resourceId, startDate, endDate);
    if (!scheduleValidation.isValid) {
      return res.status(400).json({
        message: scheduleValidation.message
      });
    }

    // Verificar disponibilidad
    const availability = await checkResourceAvailability(resourceId, startDate, endDate);
    
    if (!availability.isAvailable) {
      return res.status(409).json({
        message: "El recurso no está disponible en el horario solicitado",
        conflictingReservation: availability.conflictingReservation
      });
    }

    // Crear la reserva
    const reservation = await Reservation.create({
      resourceId,
      userId,
      startDateTime: startDate,
      endDateTime: endDate,
      purpose,
      attendees,
      isRepetitive,
      status: 'pendiente'
    });

    // Obtener datos relacionados por separado para la respuesta
    const resourceWithDetails = await Resource.findByPk(resourceId);
    const resourceType = await ResourceType.findByPk(resourceWithDetails.typeId);
    const unit = await Unit.findByPk(resourceType.unitId);
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    res.status(201).json({
      message: "Reserva creada exitosamente",
      reservation: {
        ...reservation.toJSON(),
        Resource: {
          ...resourceWithDetails.toJSON(),
          ResourceType: {
            ...resourceType.toJSON(),
            Unit: unit
          }
        },
        User: user
      }
    });

  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(500).json({ message: "Error al crear la reserva: " + error.message });
  }
};

// Obtener mis reservas - SIN INCLUDE
const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;

    const whereConditions = { userId };
    
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      order: [['startDateTime', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    // Obtener datos relacionados por separado
    const reservationsWithDetails = await Promise.all(
      reservations.map(async (reservation) => {
        const resource = await Resource.findByPk(reservation.resourceId);
        let resourceType = null;
        let unit = null;
        
        if (resource) {
          resourceType = await ResourceType.findByPk(resource.typeId);
          if (resourceType) {
            unit = await Unit.findByPk(resourceType.unitId, {
              attributes: ['id', 'name']
            });
          }
        }
        
        return {
          ...reservation.toJSON(),
          Resource: resource ? {
            ...resource.toJSON(),
            ResourceType: resourceType ? {
              ...resourceType.toJSON(),
              Unit: unit
            } : null
          } : null
        };
      })
    );

    res.json({
      reservations: reservationsWithDetails,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });

  } catch (error) {
    console.error("Error al obtener mis reservas:", error);
    res.status(500).json({ message: "Error al obtener las reservas: " + error.message });
  }
};

// Obtener reserva específica - SIN INCLUDE
const getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const whereConditions = { id };

    // Si no es admin/empleado, solo puede ver sus propias reservas
    if (!['administrador', 'empleado_unidad'].includes(userRole)) {
      whereConditions.userId = userId;
    }

    const reservation = await Reservation.findOne({
      where: whereConditions
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    // Obtener datos relacionados por separado
    const resource = await Resource.findByPk(reservation.resourceId);
    let resourceType = null;
    let unit = null;
    let user = null;
    
    if (resource) {
      resourceType = await ResourceType.findByPk(resource.typeId);
      if (resourceType) {
        unit = await Unit.findByPk(resourceType.unitId, {
          attributes: ['id', 'name']
        });
      }
    }
    
    user = await User.findByPk(reservation.userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'rol']
    });

    const reservationWithDetails = {
      ...reservation.toJSON(),
      Resource: resource ? {
        ...resource.toJSON(),
        ResourceType: resourceType ? {
          ...resourceType.toJSON(),
          Unit: unit
        } : null
      } : null,
      User: user
    };

    res.json(reservationWithDetails);

  } catch (error) {
    console.error("Error al obtener reserva:", error);
    res.status(500).json({ message: "Error al obtener la reserva: " + error.message });
  }
};

// Cancelar reserva
const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const whereConditions = { id };

    // Si no es admin/empleado, solo puede cancelar sus propias reservas
    if (!['administrador', 'empleado_unidad'].includes(userRole)) {
      whereConditions.userId = userId;
    }

    const reservation = await Reservation.findOne({
      where: whereConditions
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    // Verificar que la reserva se puede cancelar
    if (reservation.status === 'cancelada') {
      return res.status(400).json({ message: "La reserva ya está cancelada" });
    }

    if (reservation.status === 'finalizada') {
      return res.status(400).json({ message: "No se puede cancelar una reserva finalizada" });
    }

    // Verificar que no sea demasiado tarde para cancelar (ej: 1 hora antes)
    const startDate = new Date(reservation.startDateTime);
    const now = new Date();
    const timeDiff = startDate - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 1 && userRole === 'estudiante') {
      return res.status(400).json({ 
        message: "No se puede cancelar la reserva con menos de 1 hora de anticipación" 
      });
    }

    // Cancelar la reserva
    await reservation.update({
      status: 'cancelada'
    });

    res.json({
      message: "Reserva cancelada exitosamente",
      reservation
    });

  } catch (error) {
    console.error("Error al cancelar reserva:", error);
    res.status(500).json({ message: "Error al cancelar la reserva: " + error.message });
  }
};

// Obtener todas las reservas (admin/empleado) - SIN INCLUDE
const getAllReservations = async (req, res) => {
  try {
    const { status, resourceId, userId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const whereConditions = {};

    // Aplicar filtros
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (resourceId) {
      whereConditions.resourceId = resourceId;
    }

    if (userId) {
      whereConditions.userId = userId;
    }

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      order: [['startDateTime', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
    });

    // Obtener datos relacionados por separado
    const reservationsWithDetails = await Promise.all(
      reservations.map(async (reservation) => {
        const resource = await Resource.findByPk(reservation.resourceId);
        let resourceType = null;
        let unit = null;
        let user = null;
        
        if (resource) {
          resourceType = await ResourceType.findByPk(resource.typeId);
          if (resourceType) {
            unit = await Unit.findByPk(resourceType.unitId, {
              attributes: ['id', 'name']
            });
          }
        }
        
        user = await User.findByPk(reservation.userId, {
          attributes: ['id', 'firstName', 'lastName', 'email', 'rol']
        });

        return {
          ...reservation.toJSON(),
          Resource: resource ? {
            ...resource.toJSON(),
            ResourceType: resourceType ? {
              ...resourceType.toJSON(),
              Unit: unit
            } : null
          } : null,
          User: user
        };
      })
    );

    res.json({
      reservations: reservationsWithDetails,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });

  } catch (error) {
    console.error("Error al obtener todas las reservas:", error);
    res.status(500).json({ message: "Error al obtener las reservas: " + error.message });
  }
};

// Actualizar estado de reserva (admin/empleado)
const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendiente', 'activa', 'finalizada', 'cancelada'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Estado inválido. Debe ser uno de: ${validStatuses.join(', ')}` 
      });
    }

    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    await reservation.update({ status });

    res.json({
      message: `Estado de reserva actualizado a: ${status}`,
      reservation
    });

  } catch (error) {
    console.error("Error al actualizar estado de reserva:", error);
    res.status(500).json({ message: "Error al actualizar el estado de la reserva: " + error.message });
  }
};

// Obtener reservas por recurso - SIN INCLUDE
const getResourceReservations = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { startDate, endDate } = req.query;

    const whereConditions = { resourceId };

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const reservations = await Reservation.findAll({
      where: whereConditions,
      order: [['startDateTime', 'ASC']]
    });

    // Obtener datos de usuarios por separado
    const reservationsWithUsers = await Promise.all(
      reservations.map(async (reservation) => {
        const user = await User.findByPk(reservation.userId, {
          attributes: ['id', 'firstName', 'lastName']
        });

        return {
          ...reservation.toJSON(),
          User: user
        };
      })
    );

    res.json(reservationsWithUsers);

  } catch (error) {
    console.error("Error al obtener reservas por recurso:", error);
    res.status(500).json({ message: "Error al obtener las reservas del recurso: " + error.message });
  }
};

// Obtener reservas por usuario - SIN INCLUDE
const getUserReservations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;

    const whereConditions = { userId };

    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const reservations = await Reservation.findAll({
      where: whereConditions,
      order: [['startDateTime', 'DESC']]
    });

    // Obtener datos de recursos por separado
    const reservationsWithResources = await Promise.all(
      reservations.map(async (reservation) => {
        const resource = await Resource.findByPk(reservation.resourceId);
        let resourceType = null;
        
        if (resource) {
          resourceType = await ResourceType.findByPk(resource.typeId, {
            attributes: ['id', 'name']
          });
        }

        return {
          ...reservation.toJSON(),
          Resource: resource ? {
            ...resource.toJSON(),
            ResourceType: resourceType
          } : null
        };
      })
    );

    res.json(reservationsWithResources);

  } catch (error) {
    console.error("Error al obtener reservas por usuario:", error);
    res.status(500).json({ message: "Error al obtener las reservas del usuario: " + error.message });
  }
};

// ========== CONTROLADORES DE CALENDARIO SIN INCLUDE ==========

// Verificar disponibilidad
const checkResourceAvailabilityController = async (req, res) => {
  try {
    const { resourceId, startDateTime, endDateTime } = req.body;

    if (!resourceId || !startDateTime || !endDateTime) {
      return res.status(400).json({ 
        message: "Faltan campos requeridos: resourceId, startDateTime, endDateTime" 
      });
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (startDate >= endDate) {
      return res.status(400).json({ 
        message: "La fecha de inicio debe ser anterior a la fecha de fin" 
      });
    }

    if (startDate < new Date()) {
      return res.status(400).json({ 
        message: "No se pueden verificar disponibilidad en el pasado" 
      });
    }

    // Verificar recurso - SIN INCLUDE
    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true
      }
    });

    if (!resource) {
      return res.status(404).json({ 
        message: "Recurso no encontrado" 
      });
    }

    // Validar horario
    const scheduleValidation = await validateTimeAgainstSchedule(resourceId, startDate, endDate);
    if (!scheduleValidation.isValid) {
      return res.status(400).json({
        message: scheduleValidation.message
      });
    }

    // Verificar disponibilidad
    const availability = await checkResourceAvailability(resourceId, startDate, endDate);
    
    res.json({
      isAvailable: availability.isAvailable && scheduleValidation.isValid,
      message: availability.isAvailable && scheduleValidation.isValid
        ? "El recurso está disponible en el horario solicitado" 
        : "El recurso no está disponible en el horario solicitado",
      conflictingReservation: availability.conflictingReservation
    });

  } catch (error) {
    console.error("Error en checkResourceAvailability:", error);
    res.status(500).json({ 
      message: "Error al verificar disponibilidad",
      error: error.message 
    });
  }
};

// Obtener slots disponibles para un recurso en una fecha específica
const getResourceAvailability = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;

    if (!resourceId || !date) {
      return res.status(400).json({ 
        message: "Faltan parámetros: resourceId y date" 
      });
    }

    // Validar formato de fecha
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ 
        message: "Formato de fecha inválido. Use YYYY-MM-DD" 
      });
    }

    // Verificar que no sea en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({ 
        message: "No se puede consultar disponibilidad en fechas pasadas" 
      });
    }

    // Verificar que el recurso existe - SIN INCLUDE
    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true
      }
    });

    if (!resource) {
      return res.status(404).json({ 
        message: "Recurso no encontrado" 
      });
    }

    // Obtener tipo de recurso por separado
    const resourceType = await ResourceType.findByPk(resource.typeId, {
      attributes: ['id', 'name', 'granularity']
    });

    // Usar tu helper para generar los slots disponibles
    const availableSlots = await generateAvailableSlots(resourceId, date);

    // Obtener reservas del día para referencia
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await Reservation.findAll({
      where: {
        resourceId,
        startDateTime: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [Op.in]: ['pendiente', 'activa']
        }
      },
      attributes: ['id', 'startDateTime', 'endDateTime', 'purpose'],
      order: [['startDateTime', 'ASC']]
    });

    // Obtener datos de usuarios por separado
    const reservationsWithUsers = await Promise.all(
      reservations.map(async (reservation) => {
        const user = await User.findByPk(reservation.userId, {
          attributes: ['firstName', 'lastName']
        });

        return {
          id: reservation.id,
          start: reservation.startDateTime,
          end: reservation.endDateTime,
          purpose: reservation.purpose,
          user: user ? `${user.firstName} ${user.lastName}` : 'Usuario'
        };
      })
    );

    res.json({
      date: targetDate.toISOString().split('T')[0],
      resource: {
        id: resource.id,
        name: resource.name,
        type: resourceType ? resourceType.name : 'Desconocido',
        granularity: resourceType ? resourceType.granularity : 30
      },
      availableSlots,
      existingReservations: reservationsWithUsers,
      summary: {
        totalSlots: availableSlots.length,
        availableSlots: availableSlots.filter(slot => slot.isAvailable).length,
        occupiedSlots: availableSlots.filter(slot => !slot.isAvailable).length
      }
    });

  } catch (error) {
    console.error("Error en getResourceAvailability:", error);
    res.status(500).json({ 
      message: "Error al obtener disponibilidad",
      error: error.message 
    });
  }
};

// Obtener disponibilidad para múltiples días
const getResourceAvailabilityRange = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { startDate, endDate } = req.query;

    if (!resourceId || !startDate || !endDate) {
      return res.status(400).json({ 
        message: "Faltan parámetros: resourceId, startDate y endDate" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ 
        message: "La fecha de inicio debe ser anterior a la fecha de fin" 
      });
    }

    // Verificar que el recurso existe - SIN INCLUDE
    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true
      }
    });

    if (!resource) {
      return res.status(404).json({ 
        message: "Recurso no encontrado" 
      });
    }

    // Generar disponibilidad para cada día del rango
    const availabilityByDay = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        const slots = await generateAvailableSlots(resourceId, dateStr);
        const availableCount = slots.filter(slot => slot.isAvailable).length;
        
        availabilityByDay.push({
          date: dateStr,
          dayOfWeek: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
          available: availableCount > 0,
          availableSlots: availableCount,
          totalSlots: slots.length
        });
      } catch (error) {
        availabilityByDay.push({
          date: dateStr,
          dayOfWeek: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
          available: false,
          availableSlots: 0,
          totalSlots: 0,
          error: error.message
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      resource: {
        id: resource.id,
        name: resource.name
      },
      dateRange: {
        start: startDate,
        end: endDate
      },
      availabilityByDay,
      summary: {
        totalDays: availabilityByDay.length,
        availableDays: availabilityByDay.filter(day => day.available).length,
        totalAvailableSlots: availabilityByDay.reduce((sum, day) => sum + day.availableSlots, 0)
      }
    });

  } catch (error) {
    console.error("Error en getResourceAvailabilityRange:", error);
    res.status(500).json({ 
      message: "Error al obtener disponibilidad en rango",
      error: error.message 
    });
  }
};

// Exportar todos los controladores
module.exports = {
  createReservation,
  getMyReservations,
  getReservation,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  getResourceReservations,
  getUserReservations,
  checkResourceAvailability: checkResourceAvailabilityController,
  getResourceAvailability,
  getResourceAvailabilityRange
};