// controllers/typeScheduleController.js - VERSIÓN CORREGIDA CON FORMATO DE HORAS
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const TypeSchedule = require("../../../../../models/TypeSchedule");
const UnitSchedule = require("../../../../../models/UnitSchedule");
const { Op } = require("sequelize");

// Función auxiliar para normalizar formato de horas
const normalizeTime = (timeStr) => {
  if (!timeStr) return null;
  
  // Si ya tiene segundos, devolver como está
  if (timeStr.includes(':') && timeStr.split(':').length === 3) {
    return timeStr;
  }
  
  // Si solo tiene horas:minutos, agregar segundos
  if (timeStr.includes(':') && timeStr.split(':').length === 2) {
    return timeStr + ':00';
  }
  
  return timeStr;
};

// Función auxiliar para comparar horas
const compareTimes = (time1, time2) => {
  const normalized1 = normalizeTime(time1);
  const normalized2 = normalizeTime(time2);
  
  // Comparar como strings (funciona para formato HH:MM:SS)
  return normalized1.localeCompare(normalized2);
};

const getCompleteTypeSchedule = async (req, res) => {
  try {
    const { typeId } = req.params;

    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const schedules = await TypeSchedule.findAll({
      where: { typeId },
      order: [["dayOfWeek", "ASC"]],
    });

    const unit = await Unit.findByPk(resourceType.unitId);
    const unitSchedules = await UnitSchedule.findAll({
      where: { unitId: resourceType.unitId },
      order: [["dayOfWeek", "ASC"]],
    });

    res.json({
      message: "Horario completo obtenido exitosamente",
      resourceType: {
        id: resourceType.id,
        name: resourceType.name,
        description: resourceType.description,
        granularity: resourceType.granularity,
        isActive: resourceType.isActive,
        unit: unit,
        schedules: schedules,
        unitSchedules: unitSchedules
      }
    });
  } catch (error) {
    console.error("Error al obtener horario completo:", error);
    res.status(500).json({ message: "Error al obtener horario completo" });
  }
};

const addScheduleToType = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { dayOfWeek, startTime, endTime, isActive = true } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ 
        message: "dayOfWeek, startTime y endTime son requeridos" 
      });
    }

    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const unitSchedule = await UnitSchedule.findOne({
      where: { 
        unitId: resourceType.unitId, 
        dayOfWeek: dayOfWeek,
        isActive: true 
      }
    });

    if (!unitSchedule) {
      return res.status(400).json({ 
        message: `La unidad no tiene horario configurado para ${dayOfWeek} o está inactivo` 
      });
    }

    // Normalizar horas para comparación
    const normalizedStartTime = normalizeTime(startTime);
    const normalizedEndTime = normalizeTime(endTime);
    const unitStart = normalizeTime(unitSchedule.startTime);
    const unitEnd = normalizeTime(unitSchedule.endTime);

    // CORREGIDO: Usar función de comparación
    if (compareTimes(normalizedStartTime, unitStart) < 0 || compareTimes(normalizedEndTime, unitEnd) > 0) {
      return res.status(400).json({
        message: `El horario debe estar dentro o ser igual al horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`
      });
    }

    const existingSchedule = await TypeSchedule.findOne({
      where: { typeId, dayOfWeek }
    });

    if (existingSchedule) {
      return res.status(400).json({
        message: `Ya existe un horario para ${dayOfWeek} en este tipo de recurso`
      });
    }

    const schedule = await TypeSchedule.create({
      typeId,
      dayOfWeek,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      isActive,
    });

    res.status(201).json({
      message: "Horario agregado exitosamente",
      schedule
    });
  } catch (error) {
    console.error("Error al agregar horario:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'Ya existe un horario para este día en el tipo de recurso' 
      });
    }
    
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const getTypeSchedules = async (req, res) => {
  try {
    const { typeId } = req.params;
    
    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const schedules = await TypeSchedule.findAll({
      where: { typeId },
      order: [
        ["dayOfWeek", "ASC"],
        ["startTime", "ASC"],
      ],
    });

    res.json({
      message: "Horarios obtenidos exitosamente",
      schedules,
      count: schedules.length
    });
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    res.status(500).json({ message: "Error al obtener horarios" });
  }
};

const updateTypeSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { dayOfWeek, startTime, endTime, isActive } = req.body;

    const schedule = await TypeSchedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    const resourceType = await ResourceType.findByPk(schedule.typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    if (dayOfWeek || startTime || endTime) {
      const finalDayOfWeek = dayOfWeek || schedule.dayOfWeek;
      
      const unitSchedule = await UnitSchedule.findOne({
        where: { 
          unitId: resourceType.unitId, 
          dayOfWeek: finalDayOfWeek,
          isActive: true 
        }
      });

      if (!unitSchedule) {
        return res.status(400).json({ 
          message: `La unidad no tiene horario configurado para ${finalDayOfWeek} o está inactivo` 
        });
      }

      const finalStartTime = normalizeTime(startTime || schedule.startTime);
      const finalEndTime = normalizeTime(endTime || schedule.endTime);
      const unitStart = normalizeTime(unitSchedule.startTime);
      const unitEnd = normalizeTime(unitSchedule.endTime);

      // CORREGIDO: Usar función de comparación
      if (compareTimes(finalStartTime, unitStart) < 0 || compareTimes(finalEndTime, unitEnd) > 0) {
        return res.status(400).json({
          message: `El horario debe estar dentro o ser igual al horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`
        });
      }
    }

    await schedule.update({
      dayOfWeek: dayOfWeek || schedule.dayOfWeek,
      startTime: startTime ? normalizeTime(startTime) : schedule.startTime,
      endTime: endTime ? normalizeTime(endTime) : schedule.endTime,
      isActive: isActive !== undefined ? isActive : schedule.isActive,
    });

    res.json({
      message: "Horario actualizado exitosamente",
      schedule
    });
  } catch (error) {
    console.error("Error al actualizar horario:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'Ya existe un horario para este día en el tipo de recurso' 
      });
    }
    
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const deleteTypeSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await TypeSchedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    await schedule.destroy();
    
    res.json({
      message: "Horario eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar horario:", error);
    res.status(500).json({ message: "Error al eliminar horario" });
  }
};

const toggleDaySchedule = async (req, res) => {
  try {
    const { typeId, dayOfWeek } = req.params;
    const { isActive } = req.body;

    console.log("🔧 toggleDaySchedule llamado:", { typeId, dayOfWeek, isActive });

    if (isActive === undefined) {
      return res.status(400).json({ 
        message: "El campo isActive es requerido" 
      });
    }

    const schedule = await TypeSchedule.findOne({
      where: { typeId, dayOfWeek },
    });

    if (!schedule) {
      return res.status(404).json({ 
        message: `Horario para ${dayOfWeek} no encontrado` 
      });
    }

    await schedule.update({ isActive: isActive });
    
    res.json({
      message: `Horario para ${dayOfWeek} ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      schedule
    });
  } catch (error) {
    console.error("Error al alternar horario:", error);
    res.status(500).json({ 
      message: "Error al alternar horario",
      error: error.message 
    });
  }
};

const addMultipleSchedules = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ 
        message: "El array de horarios es requerido y no puede estar vacío" 
      });
    }

    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const unitSchedules = await UnitSchedule.findAll({
      where: { unitId: resourceType.unitId, isActive: true }
    });

    const validatedSchedules = [];
    const errors = [];

    for (const schedule of schedules) {
      if (!schedule.dayOfWeek || !schedule.startTime || !schedule.endTime) {
        errors.push(`Horario incompleto para algún día: dayOfWeek, startTime y endTime son requeridos`);
        continue;
      }

      const unitSchedule = unitSchedules.find(us => us.dayOfWeek === schedule.dayOfWeek);
      
      if (!unitSchedule) {
        errors.push(`La unidad no tiene horario configurado para ${schedule.dayOfWeek} o está inactivo`);
        continue;
      }

      // Normalizar horas para comparación
      const normalizedStartTime = normalizeTime(schedule.startTime);
      const normalizedEndTime = normalizeTime(schedule.endTime);
      const unitStart = normalizeTime(unitSchedule.startTime);
      const unitEnd = normalizeTime(unitSchedule.endTime);

      // CORREGIDO: Usar función de comparación
      if (compareTimes(normalizedStartTime, unitStart) < 0 || compareTimes(normalizedEndTime, unitEnd) > 0) {
        errors.push(`El horario para ${schedule.dayOfWeek} debe estar dentro o ser igual al horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`);
        continue;
      }

      if (compareTimes(normalizedStartTime, normalizedEndTime) >= 0) {
        errors.push(`Para ${schedule.dayOfWeek}: La hora de inicio debe ser menor que la hora de fin`);
        continue;
      }

      const existingSchedule = await TypeSchedule.findOne({
        where: { typeId, dayOfWeek: schedule.dayOfWeek }
      });

      if (existingSchedule) {
        errors.push(`Ya existe un horario para ${schedule.dayOfWeek} en este tipo de recurso`);
        continue;
      }

      validatedSchedules.push({
        dayOfWeek: schedule.dayOfWeek,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        typeId: parseInt(typeId),
        isActive: schedule.isActive !== undefined ? schedule.isActive : true
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: "Errores de validación en algunos horarios",
        errors: errors
      });
    }

    if (validatedSchedules.length === 0) {
      return res.status(400).json({ 
        message: "No hay horarios válidos para guardar después de la validación"
      });
    }

    console.log("📋 Horarios validados para crear:", validatedSchedules);

    const createdSchedules = await TypeSchedule.bulkCreate(validatedSchedules, {
      validate: true
    });

    res.status(201).json({
      message: `${createdSchedules.length} horarios agregados exitosamente`,
      schedules: createdSchedules
    });

  } catch (error) {
    console.error("Error al agregar múltiples horarios:", error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'Uno o más horarios ya existen para estos días en el tipo de recurso',
        details: 'Violación de constraint único'
      });
    }

    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => `${err.path}: ${err.message}`);
      return res.status(400).json({ 
        message: 'Errores de validación en los datos',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message 
    });
  }
};

const updateAllTypeSchedules = async (req, res) => {
  try {
    const { typeId } = req.params;
    const { schedules } = req.body;

    console.log("📥 updateAllTypeSchedules - Datos recibidos:", {
      typeId,
      schedulesCount: schedules?.length,
      schedules
    });

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ 
        message: "El array de horarios es requerido" 
      });
    }

    const resourceType = await ResourceType.findByPk(typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    const unitSchedules = await UnitSchedule.findAll({
      where: { unitId: resourceType.unitId, isActive: true }
    });

    console.log("📊 Horarios de unidad disponibles:", unitSchedules.map(us => ({
      day: us.dayOfWeek,
      start: us.startTime,
      end: us.endTime
    })));

    const results = {
      created: [],
      updated: [],
      errors: [],
      skipped: []
    };

    for (const scheduleData of schedules) {
      try {
        const { dayOfWeek, startTime, endTime, isActive = true } = scheduleData;

        console.log(`🔍 Procesando ${dayOfWeek}:`, { startTime, endTime, isActive });

        if (!startTime || !endTime) {
          console.log(`⏭️ ${dayOfWeek}: Sin horario, marcando como inactivo`);
          
          const existingSchedule = await TypeSchedule.findOne({
            where: { typeId, dayOfWeek }
          });

          if (existingSchedule) {
            await existingSchedule.update({
              startTime: null,
              endTime: null,
              isActive: false
            });
            results.updated.push({
              dayOfWeek,
              id: existingSchedule.id,
              action: 'deactivated',
              reason: 'no schedule time'
            });
          } else {
            results.skipped.push({
              dayOfWeek,
              action: 'skipped',
              reason: 'no schedule time and not existing'
            });
          }
          continue;
        }

        const unitSchedule = unitSchedules.find(us => us.dayOfWeek === dayOfWeek);
        if (!unitSchedule) {
          results.errors.push({
            dayOfWeek,
            error: `La unidad no tiene horario configurado para ${dayOfWeek} o está inactivo`
          });
          continue;
        }

        // Normalizar horas para comparación
        const normalizedStartTime = normalizeTime(startTime);
        const normalizedEndTime = normalizeTime(endTime);
        const unitStart = normalizeTime(unitSchedule.startTime);
        const unitEnd = normalizeTime(unitSchedule.endTime);

        // CORREGIDO: Usar función de comparación
        if (compareTimes(normalizedStartTime, unitStart) < 0 || compareTimes(normalizedEndTime, unitEnd) > 0) {
          results.errors.push({
            dayOfWeek,
            error: `Debe estar dentro o ser igual a: ${unitSchedule.startTime} - ${unitSchedule.endTime}`
          });
          continue;
        }

        if (compareTimes(normalizedStartTime, normalizedEndTime) >= 0) {
          results.errors.push({
            dayOfWeek,
            error: "La hora de inicio debe ser menor que la hora de fin"
          });
          continue;
        }

        const existingSchedule = await TypeSchedule.findOne({
          where: { typeId, dayOfWeek }
        });

        if (existingSchedule) {
          await existingSchedule.update({
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
            isActive
          });
          results.updated.push({
            dayOfWeek,
            id: existingSchedule.id,
            action: 'updated'
          });
        } else {
          const newSchedule = await TypeSchedule.create({
            typeId: parseInt(typeId),
            dayOfWeek,
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
            isActive
          });
          results.created.push({
            dayOfWeek,
            id: newSchedule.id,
            action: 'created'
          });
        }

      } catch (error) {
        console.error(`❌ Error procesando horario:`, error);
        results.errors.push({
          dayOfWeek: scheduleData.dayOfWeek,
          error: error.message
        });
      }
    }

    console.log("📊 Resultados del procesamiento:", results);

    if (results.errors.length > 0 && (results.created.length > 0 || results.updated.length > 0)) {
      return res.status(207).json({
        message: "Algunos horarios fueron procesados con errores",
        results,
        summary: {
          totalProcessed: schedules.length,
          created: results.created.length,
          updated: results.updated.length,
          deactivated: results.updated.filter(r => r.action === 'deactivated').length,
          skipped: results.skipped.length,
          errors: results.errors.length
        }
      });
    }

    if (results.errors.length > 0 && results.created.length === 0 && results.updated.length === 0) {
      return res.status(400).json({
        message: "Todos los horarios tuvieron errores",
        errors: results.errors
      });
    }

    res.json({
      message: "Todos los horarios han sido procesados exitosamente",
      results,
      summary: {
        totalProcessed: schedules.length,
        created: results.created.length,
        updated: results.updated.length,
        deactivated: results.updated.filter(r => r.action === 'deactivated').length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });

  } catch (error) {
    console.error("🔥 Error en updateAllTypeSchedules:", error);
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => `${err.path}: ${err.message}`);
      return res.status(400).json({ 
        message: 'Errores de validación en los datos',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: "Error interno del servidor",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  addScheduleToType,
  getTypeSchedules,
  getCompleteTypeSchedule,
  updateTypeSchedule,
  deleteTypeSchedule,
  toggleDaySchedule,
  addMultipleSchedules,
  updateAllTypeSchedules,
};