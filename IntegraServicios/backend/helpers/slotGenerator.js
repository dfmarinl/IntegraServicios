const { Op } = require('sequelize');
const Resource = require('../models/Resource');
const ResourceType = require('../models/ResourceType');
const TypeSchedule = require('../models/TypeSchedule');
const Reservation = require('../models/Reservation');

// ========== FUNCIONES DE TIMEZONE ==========
const TIMEZONE_OFFSET_COLOMBIA = -5 * 60 * 60 * 1000; // Colombia UTC-5

const adjustToColombiaFromUTC = (utcDate) => {
  return new Date(utcDate.getTime() + TIMEZONE_OFFSET_COLOMBIA);
};

const adjustToUTCFromColombia = (colombiaDate) => {
  return new Date(colombiaDate.getTime() - TIMEZONE_OFFSET_COLOMBIA);
};

/**
 * Genera slots disponibles para un recurso en una fecha específica
 */
const generateAvailableSlots = async (resourceId, targetDate) => {
  try {
    console.log('🎯 GENERANDO SLOTS - Inicio');
    console.log('   Recurso ID:', resourceId);
    console.log('   Fecha recibida:', targetDate);

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

    // 2. Determinar el día de la semana (CORREGIDO)
    // IMPORTANTE: Usar mediodía UTC para evitar problemas de timezone
    const dateObj = new Date(targetDate + 'T12:00:00Z');
    
    // Ajustar a Colombia para obtener el día correcto
    const dateObjColombia = adjustToColombiaFromUTC(dateObj);
    
    const dayMap = {
      0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles', 
      4: 'jueves', 5: 'viernes', 6: 'sabado'
    };
    
    const targetDayOfWeek = dayMap[dateObjColombia.getDay()];
    
    console.log('📅 DEBUG - Cálculo de día:');
    console.log('   Fecha recibida:', targetDate);
    console.log('   Fecha con mediodía UTC:', dateObj.toISOString());
    console.log('   Fecha en Colombia:', dateObjColombia.toLocaleString('es-CO'));
    console.log('   getDay() UTC:', dateObj.getDay(), '->', dayMap[dateObj.getDay()]);
    console.log('   getDay() Colombia:', dateObjColombia.getDay(), '->', targetDayOfWeek);
    console.log('✅ Día de la semana (Colombia):', targetDayOfWeek);

    // 3. Buscar horario para este día
    const scheduleForDay = await TypeSchedule.findOne({
      where: {
        typeId: resourceType.id,
        dayOfWeek: targetDayOfWeek,
        isActive: true
      }
    });

    console.log('✅ Horario encontrado:', scheduleForDay ? 'Sí' : 'No');

    // Si no hay horario para este día, retornar array vacío
    if (!scheduleForDay) {
      console.log('ℹ️  No hay horario configurado para', targetDayOfWeek);
      return [];
    }

    // 4. Configurar granularidad
    const granularity = resourceType.granularity || 30;
    const slotDuration = granularity * 60 * 1000;

    console.log('⏰ Horario de BD:', scheduleForDay.startTime, '-', scheduleForDay.endTime);
    console.log('⚙️  Duración de slot:', granularity, 'minutos');

    // 5. Crear objetos Date con los horarios (CORREGIDO)
    const dateForSchedule = targetDate; // "2025-12-08"
    
    // Extraer solo HH:MM si tiene segundos
    const formatTimeFromDB = (timeStr) => {
      // Si es "09:00:00" -> tomar "09:00"
      if (timeStr && timeStr.includes(':')) {
        const parts = timeStr.split(':');
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`;
        }
      }
      return timeStr || '00:00';
    };

    const startTimeOnly = formatTimeFromDB(scheduleForDay.startTime);
    const endTimeOnly = formatTimeFromDB(scheduleForDay.endTime);
    
    console.log('⏰ Tiempos procesados:');
    console.log('   Original start:', scheduleForDay.startTime);
    console.log('   Original end:', scheduleForDay.endTime);
    console.log('   Formateado start:', startTimeOnly);
    console.log('   Formateado end:', endTimeOnly);

    // Construir fecha en Colombia
    const startTimeLocal = new Date(`${dateForSchedule}T${startTimeOnly}:00`);
    const endTimeLocal = new Date(`${dateForSchedule}T${endTimeOnly}:00`);
    
    console.log('📅 Fechas construidas:');
    console.log('   String start:', `${dateForSchedule}T${startTimeOnly}:00`);
    console.log('   String end:', `${dateForSchedule}T${endTimeOnly}:00`);
    console.log('   startTimeLocal válida?', !isNaN(startTimeLocal.getTime()));
    console.log('   endTimeLocal válida?', !isNaN(endTimeLocal.getTime()));

    if (isNaN(startTimeLocal.getTime()) || isNaN(endTimeLocal.getTime())) {
      throw new Error('Horarios del recurso no válidos');
    }

    // Convertir a UTC para comparación
    const startTime = adjustToUTCFromColombia(startTimeLocal);
    const endTime = adjustToUTCFromColombia(endTimeLocal);

    console.log('📅 Horarios finales:');
    console.log('   Start local (Colombia):', startTimeLocal.toLocaleString('es-CO'));
    console.log('   End local (Colombia):', endTimeLocal.toLocaleString('es-CO'));
    console.log('   Start UTC:', startTime.toISOString());
    console.log('   End UTC:', endTime.toISOString());

    // 6. Obtener reservas existentes para esa fecha
    const startOfDay = new Date(targetDate + 'T00:00:00Z');
    const endOfDay = new Date(targetDate + 'T23:59:59.999Z');

    console.log('📅 Rango para buscar reservas:');
    console.log('   Desde (UTC):', startOfDay.toISOString());
    console.log('   Hasta (UTC):', endOfDay.toISOString());

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

    console.log('⏳ Generando slots desde:', currentSlotStart.toISOString());
    console.log('   Hasta:', endTime.toISOString());

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
        
        const overlaps = (currentSlotStart < resEnd && currentSlotEnd > resStart);
        return overlaps;
      });

      // Convertir a hora Colombia para mostrar
      const startTimeColombia = adjustToColombiaFromUTC(currentSlotStart);
      const endTimeColombia = adjustToColombiaFromUTC(currentSlotEnd);

      slots.push({
        startTime: new Date(currentSlotStart),
        endTime: new Date(currentSlotEnd),
        startTimeFormatted: startTimeColombia.toTimeString().slice(0, 5),
        endTimeFormatted: endTimeColombia.toTimeString().slice(0, 5),
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
  generateAvailableSlots,
  adjustToColombiaFromUTC,
  adjustToUTCFromColombia
};