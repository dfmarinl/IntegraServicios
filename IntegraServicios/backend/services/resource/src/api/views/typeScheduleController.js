// controllers/typeScheduleController.js - VERSIÓN CORREGIDA
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const TypeSchedule = require("../../../../../models/TypeSchedule");
const UnitSchedule = require("../../../../../models/UnitSchedule");
const { Op } = require("sequelize");

// CONTROLADOR COMPLETO CORREGIDO
const getCompleteTypeSchedule = async (req, res) => {
  try {
    const { typeId } = req.params;

    // Obtener datos por separado - SIN INCLUDE
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

    // Obtener datos por separado - SIN INCLUDE
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

    if (startTime < unitSchedule.startTime || endTime > unitSchedule.endTime) {
      return res.status(400).json({
        message: `El horario debe estar dentro del horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`
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
      startTime,
      endTime,
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

    // Obtener datos para validación - SIN INCLUDE
    const resourceType = await ResourceType.findByPk(schedule.typeId);
    if (!resourceType) {
      return res.status(404).json({ message: "Tipo de recurso no encontrado" });
    }

    // Validar contra unidad si se cambian horarios
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

      const finalStartTime = startTime || schedule.startTime;
      const finalEndTime = endTime || schedule.endTime;

      if (finalStartTime < unitSchedule.startTime || finalEndTime > unitSchedule.endTime) {
        return res.status(400).json({
          message: `El horario debe estar dentro del horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`
        });
      }
    }

    await schedule.update({
      dayOfWeek: dayOfWeek || schedule.dayOfWeek,
      startTime: startTime || schedule.startTime,
      endTime: endTime || schedule.endTime,
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

    const schedule = await TypeSchedule.findOne({
      where: { typeId, dayOfWeek },
    });

    if (!schedule) {
      return res.status(404).json({ message: "Horario no encontrado" });
    }

    await schedule.update({ isActive: !schedule.isActive });
    
    res.json({
      message: `Horario para ${dayOfWeek} ${schedule.isActive ? 'activado' : 'desactivado'} exitosamente`,
      schedule
    });
  } catch (error) {
    console.error("Error al alternar horario:", error);
    res.status(500).json({ message: "Error al alternar horario" });
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

    // Obtener datos para validación - SIN INCLUDE
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
      // Validación básica de campos requeridos
      if (!schedule.dayOfWeek || !schedule.startTime || !schedule.endTime) {
        errors.push(`Horario incompleto para algún día: dayOfWeek, startTime y endTime son requeridos`);
        continue;
      }

      // Buscar horario de unidad para este día
      const unitSchedule = unitSchedules.find(us => us.dayOfWeek === schedule.dayOfWeek);
      
      if (!unitSchedule) {
        errors.push(`La unidad no tiene horario configurado para ${schedule.dayOfWeek} o está inactivo`);
        continue;
      }

      // Validar que el horario esté dentro de los límites de la unidad
      if (schedule.startTime < unitSchedule.startTime || schedule.endTime > unitSchedule.endTime) {
        errors.push(`El horario para ${schedule.dayOfWeek} debe estar dentro del horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`);
        continue;
      }

      // Validar que startTime sea menor que endTime
      if (schedule.startTime >= schedule.endTime) {
        errors.push(`Para ${schedule.dayOfWeek}: La hora de inicio debe ser menor que la hora de fin`);
        continue;
      }

      // Verificar si ya existe un horario para este día
      const existingSchedule = await TypeSchedule.findOne({
        where: { typeId, dayOfWeek: schedule.dayOfWeek }
      });

      if (existingSchedule) {
        errors.push(`Ya existe un horario para ${schedule.dayOfWeek} en este tipo de recurso`);
        continue;
      }

      // Si pasa todas las validaciones, agregar a la lista
      validatedSchedules.push({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
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

    // Si no hay horarios válidos después de la validación
    if (validatedSchedules.length === 0) {
      return res.status(400).json({ 
        message: "No hay horarios válidos para guardar después de la validación"
      });
    }

    console.log("📋 Horarios validados para crear:", validatedSchedules);

    // Crear los horarios
    const createdSchedules = await TypeSchedule.bulkCreate(validatedSchedules, {
      validate: true // Asegurar validación a nivel de modelo
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

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ 
        message: "El array de horarios es requerido" 
      });
    }

    // Obtener datos para validación - SIN INCLUDE
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
        errors.push(`Horario incompleto: dayOfWeek, startTime y endTime son requeridos`);
        continue;
      }

      const unitSchedule = unitSchedules.find(us => us.dayOfWeek === schedule.dayOfWeek);
      if (!unitSchedule) {
        errors.push(`La unidad no tiene horario configurado para ${schedule.dayOfWeek} o está inactivo`);
        continue;
      }

      if (schedule.startTime < unitSchedule.startTime || schedule.endTime > unitSchedule.endTime) {
        errors.push(`El horario para ${schedule.dayOfWeek} debe estar dentro del horario de la unidad: ${unitSchedule.startTime} - ${unitSchedule.endTime}`);
        continue;
      }

      // Validar que startTime sea menor que endTime
      if (schedule.startTime >= schedule.endTime) {
        errors.push(`Para ${schedule.dayOfWeek}: La hora de inicio debe ser menor que la hora de fin`);
        continue;
      }

      validatedSchedules.push({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        typeId: parseInt(typeId),
        isActive: schedule.isActive !== undefined ? schedule.isActive : true
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: "Errores de validación en algunos horarios",
        errors 
      });
    }

    // Usar transacción
    const sequelize = require("../../../../../config/database");
    const result = await sequelize.transaction(async (t) => {
      await TypeSchedule.destroy({ 
        where: { typeId: parseInt(typeId) },
        transaction: t 
      });

      const newSchedules = await TypeSchedule.bulkCreate(
        validatedSchedules,
        { 
          transaction: t,
          validate: true
        }
      );

      return newSchedules;
    });

    res.json({
      message: "Todos los horarios han sido actualizados exitosamente",
      schedules: result
    });
  } catch (error) {
    console.error("Error al actualizar todos los horarios:", error);
    
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