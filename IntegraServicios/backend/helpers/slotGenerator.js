const { Op } = require('sequelize');
const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
const TypeSchedule = require('../models/TypeSchedule');
const Reservation = require('../models/Reservation');

/**
 * Genera slots disponibles para un recurso en una fecha específica
 */
const generateAvailableSlots = async (resourceId, targetDate) => {
  try {
    console.log('🎯 GENERANDO SLOTS - Inicio');
    console.log('   Recurso ID:', resourceId);
    console.log('   Fecha:', targetDate);

    // 1. Obtener el recurso y su tipo
    const resource = await Resource.findByPk(resourceId);
    if (!resource) {
      console.log('❌ Recurso no encontrado');
      throw new Error('Recurso no encontrado');
    }

    const resourceType = await ResourceType.findByPk(resource.typeId);
    if (!resourceType) {
      console.log('❌ Tipo de recurso no encontrado');
      throw new Error('Tipo de recurso no encontrado');
    }

    console.log('✅ Recurso:', resource.name);
    console.log('✅ Tipo:', resourceType.name);
    console.log('✅ Granularidad:', resourceType.granularity);

    // 2. Determinar el día de la semana
    const dateObj = new Date(targetDate);
    const dayMap = {
      0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 
      4: 'jueves', 5: 'viernes', 6: 'sabado'
    };
    
    const targetDayOfWeek = dayMap[dateObj.getDay()];
    console.log('✅ Día de la semana:', targetDayOfWeek);

    // 3. Buscar horario para este día
    const scheduleForDay = await TypeSchedule.findOne({
      where: {
        typeId: resourceType.id,
        dayOfWeek: targetDayOfWeek,
        isActive: true
      }
    });

    console.log('✅ Horario encontrado:', scheduleForDay);

    // Si no hay horario para este día, retornar array vacío
    if (!scheduleForDay) {
      console.log('ℹ️  No hay horario configurado para', targetDayOfWeek);
      return [];
    }

    // 4. Configurar granularidad
    const granularity = resourceType.granularity || 30; // minutos por defecto
    const slotDuration = granularity * 60 * 1000; // convertir a milisegundos

    console.log('⏰ Horario:', scheduleForDay.startTime, '-', scheduleForDay.endTime);
    console.log('⚙️  Duración de slot:', granularity, 'minutos');

    // 5. Crear objetos Date con los horarios
    const startTime = new Date(`${targetDate}T${scheduleForDay.startTime}`);
    const endTime = new Date(`${targetDate}T${scheduleForDay.endTime}`);

    console.log('📅 StartTime:', startTime);
    console.log('📅 EndTime:', endTime);

    // Validar horarios
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error('Horarios del recurso no válidos');
    }

    // 6. Obtener reservas existentes para esa fecha
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await Reservation.findAll({
      where: {
        resourceId,
        startDateTime: {
          [Op.between]: [startOfDay, endOfDay]
        },
        status: {
          [Op.notIn]: ['cancelada']
        }
      },
      order: [['startDateTime', 'ASC']]
    });

    console.log('📋 Reservas existentes:', existingReservations.length);

    // 7. Generar slots
    const slots = [];
    let currentSlotStart = new Date(startTime);

    while (currentSlotStart < endTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration);
      
      // Si el slot termina después del horario permitido, salir
      if (currentSlotEnd > endTime) {
        console.log('⏹️  Slot excede horario, terminando...');
        break;
      }

      // Verificar si está ocupado
      const isOccupied = existingReservations.some(reservation => {
        const resStart = new Date(reservation.startDateTime);
        const resEnd = new Date(reservation.endDateTime);
        
        // Verificar superposición
        const overlaps = (
          (currentSlotStart < resEnd && currentSlotEnd > resStart)
        );
        
        return overlaps;
      });

      slots.push({
        startTime: new Date(currentSlotStart),
        endTime: new Date(currentSlotEnd),
        startTimeFormatted: currentSlotStart.toTimeString().slice(0, 5),
        endTimeFormatted: currentSlotEnd.toTimeString().slice(0, 5),
        isAvailable: !isOccupied,
        date: targetDate,
        granularity: granularity
      });

      // Avanzar al siguiente slot
      currentSlotStart = new Date(currentSlotStart.getTime() + slotDuration);
    }

    console.log('✅ Slots generados:', slots.length);
    console.log('📊 Disponibles:', slots.filter(s => s.isAvailable).length);
    console.log('📊 Ocupados:', slots.filter(s => !s.isAvailable).length);

    return slots;

  } catch (error) {
    console.error('❌ Error en generateAvailableSlots:', error);
    console.error('🔍 Stack:', error.stack);
    throw new Error('Error al generar slots disponibles: ' + error.message);
  }
};

module.exports = {
  generateAvailableSlots
};