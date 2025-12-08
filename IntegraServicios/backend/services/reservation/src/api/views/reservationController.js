const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const User = require("../../../../../models/user");
const TypeSchedule = require("../../../../../models/TypeSchedule");
const { Op } = require("sequelize");
const {
  generateAvailableSlots,
} = require("../../../../../helpers/slotGenerator");

// ========== CONSTANTES Y CONFIGURACIÓN ==========

const TIMEZONE_OFFSET_COLOMBIA = -5 * 60 * 60 * 1000; // Colombia UTC-5 en milisegundos
const MIN_BOOKING_MINUTES = 15; // Mínimo 15 minutos de anticipación
const MAX_ADVANCE_DAYS = 365; // Máximo 1 año de anticipación
const MIN_CANCEL_HOURS = 1; // Mínimo 1 hora para cancelar

// ========== FUNCIONES HELPERS ==========

/**
 * Ajusta una fecha local a UTC considerando Colombia UTC-5
 */
const adjustToUTCFromColombia = (localDate) => {
  const adjusted = new Date(localDate.getTime() - TIMEZONE_OFFSET_COLOMBIA);
  return adjusted;
};

/**
 * Ajusta una fecha UTC a hora Colombia
 */
const adjustToColombiaFromUTC = (utcDate) => {
  const adjusted = new Date(utcDate.getTime() + TIMEZONE_OFFSET_COLOMBIA);
  return adjusted;
};

/**
 * Verifica si una fecha es "pasada" considerando Colombia UTC-5
 */
const isPastInColombia = (dateTime, marginMinutes = 0) => {
  const now = new Date();
  const colombiaNow = adjustToColombiaFromUTC(now);
  const colombiaDateTime = adjustToColombiaFromUTC(new Date(dateTime));

  const marginMs = marginMinutes * 60 * 1000;
  return colombiaDateTime < new Date(colombiaNow.getTime() - marginMs);
};

/**
 * Verifica si una fecha es futura con margen mínimo
 */
const isFutureWithMargin = (dateTime, marginMinutes) => {
  const now = new Date();
  const colombiaNow = adjustToColombiaFromUTC(now);
  const colombiaDateTime = adjustToColombiaFromUTC(new Date(dateTime));

  const marginMs = marginMinutes * 60 * 1000;
  return colombiaDateTime > new Date(colombiaNow.getTime() + marginMs);
};

/**
 * Obtiene diferencia en minutos entre ahora y una fecha (en hora Colombia)
 */
const getMinutesFromNowColombia = (dateTime) => {
  const now = new Date();
  const colombiaNow = adjustToColombiaFromUTC(now);
  const colombiaDateTime = adjustToColombiaFromUTC(new Date(dateTime));

  return Math.floor((colombiaDateTime - colombiaNow) / (1000 * 60));
};

/**
 * Formatea fecha para logs detallados
 */
const formatDateForLog = (date) => {
  const d = new Date(date);
  return {
    local: d.toLocaleString("es-CO"),
    iso: d.toISOString(),
    colombia: adjustToColombiaFromUTC(d).toLocaleString("es-CO"),
    timestamp: d.getTime(),
  };
};

// ========== FUNCIONES DE VALIDACIÓN ==========

const validateTimeAgainstSchedule = async (
  resourceId,
  startDateTime,
  endDateTime
) => {
  try {
    console.log("🔍 Validando horario para recurso:", resourceId);

    const resource = await Resource.findByPk(resourceId);
    if (!resource) {
      return { isValid: false, message: "Recurso no encontrado" };
    }

    const resourceType = await ResourceType.findByPk(resource.typeId);
    if (!resourceType) {
      return { isValid: false, message: "Tipo de recurso no encontrado" };
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);
    const dayOfWeek = startDate.getDay();

    const dayMap = {
      0: "domingo",
      1: "lunes",
      2: "martes",
      3: "miercoles",
      4: "jueves",
      5: "viernes",
      6: "sabado",
    };

    const targetDay = dayMap[dayOfWeek];

    const scheduleForDay = await TypeSchedule.findOne({
      where: {
        typeId: resourceType.id,
        dayOfWeek: targetDay,
        isActive: true,
      },
    });

    if (!scheduleForDay) {
      return {
        isValid: false,
        message: "El recurso no está disponible los " + targetDay + "s",
      };
    }

    const dateStr = startDate.toISOString().split("T")[0];
    const scheduleStart = new Date(`${dateStr}T${scheduleForDay.startTime}`);
    const scheduleEnd = new Date(`${dateStr}T${scheduleForDay.endTime}`);

    // Ajustar a UTC para comparación
    const scheduleStartUTC = adjustToUTCFromColombia(scheduleStart);
    const scheduleEndUTC = adjustToUTCFromColombia(scheduleEnd);
    const reservationStartUTC = adjustToUTCFromColombia(startDate);
    const reservationEndUTC = adjustToUTCFromColombia(endDate);

    if (reservationStartUTC < scheduleStartUTC) {
      return {
        isValid: false,
        message: `La reserva no puede comenzar antes de las ${scheduleForDay.startTime} (hora Colombia)`,
      };
    }

    if (reservationEndUTC > scheduleEndUTC) {
      return {
        isValid: false,
        message: `La reserva no puede terminar después de las ${scheduleForDay.endTime} (hora Colombia)`,
      };
    }

    const granularity = resourceType.granularity || 30;
    const durationMs = endDate - startDate;
    const durationMinutes = durationMs / (1000 * 60);

    if (durationMinutes % granularity !== 0) {
      return {
        isValid: false,
        message: `La duración de la reserva debe ser múltiplo de ${granularity} minutos`,
      };
    }

    const startMinutes = startDate.getMinutes();
    if (startMinutes % granularity !== 0) {
      return {
        isValid: false,
        message: `La hora de inicio debe ser en intervalos de ${granularity} minutos`,
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("❌ Error en validateTimeAgainstSchedule:", error);
    return { isValid: false, message: "Error al validar horario" };
  }
};

const checkResourceAvailability = async (
  resourceId,
  startDateTime,
  endDateTime,
  excludeReservationId = null
) => {
  try {
    const whereConditions = {
      resourceId,
      status: {
        [Op.in]: ["pendiente", "activa"],
      },
      [Op.or]: [
        {
          startDateTime: {
            [Op.between]: [startDateTime, endDateTime],
          },
        },
        {
          endDateTime: {
            [Op.between]: [startDateTime, endDateTime],
          },
        },
        {
          [Op.and]: [
            { startDateTime: { [Op.lte]: startDateTime } },
            { endDateTime: { [Op.gte]: endDateTime } },
          ],
        },
      ],
    };

    if (excludeReservationId) {
      whereConditions.id = { [Op.ne]: excludeReservationId };
    }

    const conflictingReservation = await Reservation.findOne({
      where: whereConditions,
    });

    return {
      isAvailable: !conflictingReservation,
      conflictingReservation: conflictingReservation || null,
    };
  } catch (error) {
    console.error("Error en checkResourceAvailability:", error);
    return { isAvailable: false, conflictingReservation: null };
  }
};

// ========== FUNCIONES PARA RESERVAS REPETITIVAS ==========

const calculateRepeatDates = (startDateTime, endDateTime, repeatConfig) => {
  const {
    frequency,
    interval = 1,
    occurrences,
    endDate: repeatEndDate,
    daysOfWeek = [],
  } = repeatConfig;

  const dates = [];
  const startDate = new Date(startDateTime);
  const originalEnd = new Date(endDateTime);
  const duration = originalEnd - startDate;

  let currentDate = new Date(startDate);
  const endCondition = repeatEndDate ? new Date(repeatEndDate) : null;

  dates.push({
    startDateTime: new Date(startDate),
    endDateTime: new Date(originalEnd),
    sequence: 1,
  });

  let count = 1;
  let sequence = 2;

  while (true) {
    if (occurrences && count >= occurrences) break;
    if (endCondition && currentDate > endCondition) break;

    let nextDate = new Date(currentDate);

    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case "weekly":
        if (daysOfWeek.length > 0) {
          let daysToAdd = 1;
          while (daysToAdd <= 7) {
            nextDate.setDate(nextDate.getDate() + 1);
            if (daysOfWeek.includes(nextDate.getDay())) {
              break;
            }
            daysToAdd++;
          }
        } else {
          nextDate.setDate(nextDate.getDate() + 7 * interval);
        }
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + interval);
    }

    if (endCondition && nextDate > endCondition) break;

    const newStart = new Date(nextDate);
    const newEnd = new Date(newStart.getTime() + duration);

    dates.push({
      startDateTime: newStart,
      endDateTime: newEnd,
      sequence: sequence,
    });

    currentDate = new Date(nextDate);
    count++;
    sequence++;

    if (count > 365) break;
  }

  return dates;
};

const validateRepeatAvailability = async (
  resourceId,
  startDateTime,
  endDateTime,
  repeatConfig
) => {
  try {
    const repeatDates = calculateRepeatDates(
      startDateTime,
      endDateTime,
      repeatConfig
    );

    const availabilityChecks = await Promise.all(
      repeatDates.map(async (date, index) => {
        if (index === 0) {
          return {
            ...date,
            isAvailable: true,
          };
        }

        const availability = await checkResourceAvailability(
          resourceId,
          date.startDateTime,
          date.endDateTime
        );
        return {
          ...date,
          isAvailable: availability.isAvailable,
          conflictingReservation: availability.conflictingReservation,
        };
      })
    );

    const conflicts = availabilityChecks.filter((check) => !check.isAvailable);

    return {
      isValid: conflicts.length === 0,
      conflicts,
      allDates: availabilityChecks,
      totalOccurrences: repeatDates.length,
    };
  } catch (error) {
    console.error("Error en validateRepeatAvailability:", error);
    return {
      isValid: false,
      message: "Error al validar disponibilidad de repeticiones",
    };
  }
};

const generateMasterId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const findRepeatSeries = async (userId, resourceId, purpose, startDateTime) => {
  try {
    const startDate = new Date(startDateTime);
    const searchStart = new Date(startDate);
    searchStart.setDate(searchStart.getDate() - 30);

    const searchEnd = new Date(startDate);
    searchEnd.setDate(searchEnd.getDate() + 30);

    const series = await Reservation.findAll({
      where: {
        userId,
        resourceId,
        purpose,
        isRepetitive: true,
        startDateTime: {
          [Op.between]: [searchStart, searchEnd],
        },
        status: { [Op.in]: ["pendiente", "activa"] },
      },
      order: [["startDateTime", "ASC"]],
    });

    return series;
  } catch (error) {
    console.error("Error en findRepeatSeries:", error);
    return [];
  }
};

// ========== CONTROLADORES PRINCIPALES ==========

const createReservation = async (req, res) => {
  try {
    const {
      resourceId,
      startDateTime,
      endDateTime,
      purpose,
      attendees = 1,
      isRepetitive = false,
      repeatConfig = null,
    } = req.body;

    const userId = req.user.id;

    console.log("📋 Creando reserva - Datos recibidos:", {
      resourceId,
      startDateTime,
      endDateTime,
      purpose,
      attendees,
      isRepetitive,
      userId,
      repeatConfig,
    });

    console.log("⏰ Debug de tiempos - Colombia:", {
      ahoraColombia: adjustToColombiaFromUTC(new Date()).toLocaleString(
        "es-CO"
      ),
      startDateTimeColombia: startDateTime
        ? adjustToColombiaFromUTC(new Date(startDateTime)).toLocaleString(
            "es-CO"
          )
        : "N/A",
      endDateTimeColombia: endDateTime
        ? adjustToColombiaFromUTC(new Date(endDateTime)).toLocaleString("es-CO")
        : "N/A",
      diferenciaMinutos: startDateTime
        ? getMinutesFromNowColombia(startDateTime)
        : "N/A",
    });

    if (!resourceId || !startDateTime || !endDateTime || !purpose) {
      return res.status(400).json({
        message:
          "Faltan campos requeridos: resourceId, startDateTime, endDateTime, purpose",
      });
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin",
      });
    }

    // ✅ CORRECCIÓN CRÍTICA: Validar considerando Colombia UTC-5
    if (isPastInColombia(startDate)) {
      const minutesFromNow = getMinutesFromNowColombia(startDate);
      return res.status(400).json({
        message: `No se pueden crear reservas en el pasado. 
                  La hora seleccionada es ${Math.abs(minutesFromNow)} minutos ${
          minutesFromNow < 0 ? "en el pasado" : "en el futuro"
        } (hora Colombia). 
                  Por favor selecciona una hora al menos ${MIN_BOOKING_MINUTES} minutos en el futuro.`,
        details: {
          selectedTime: formatDateForLog(startDate),
          serverTime: formatDateForLog(new Date()),
          differenceMinutes: minutesFromNow,
          timezone: "Colombia (UTC-5)",
          minAdvanceMinutes: MIN_BOOKING_MINUTES,
        },
      });
    }

    // Validar margen mínimo de 15 minutos
    if (!isFutureWithMargin(startDate, MIN_BOOKING_MINUTES)) {
      const minutesFromNow = getMinutesFromNowColombia(startDate);
      return res.status(400).json({
        message: `Las reservas deben hacerse con al menos ${MIN_BOOKING_MINUTES} minutos de anticipación. 
                  Tiempo hasta la reserva: ${minutesFromNow} minutos`,
        details: {
          minAdvanceMinutes: MIN_BOOKING_MINUTES,
          actualAdvanceMinutes: minutesFromNow,
          timezone: "Colombia (UTC-5)",
        },
      });
    }

    // Validar que no sea demasiado en el futuro
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + MAX_ADVANCE_DAYS);
    if (startDate > maxAdvanceDate) {
      return res.status(400).json({
        message: `Las reservas solo pueden hacerse con máximo ${MAX_ADVANCE_DAYS} días de anticipación`,
      });
    }

    if (purpose.trim().length === 0) {
      return res.status(400).json({
        message: "El propósito no puede estar vacío",
      });
    }

    if (attendees < 1) {
      return res.status(400).json({
        message: "Debe haber al menos 1 asistente",
      });
    }

    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true,
        isAvailable: true,
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Recurso no encontrado o no disponible",
      });
    }

    const scheduleValidation = await validateTimeAgainstSchedule(
      resourceId,
      startDate,
      endDate
    );
    if (!scheduleValidation.isValid) {
      return res.status(400).json({
        message: scheduleValidation.message,
      });
    }

    const availability = await checkResourceAvailability(
      resourceId,
      startDate,
      endDate
    );

    if (!availability.isAvailable) {
      return res.status(409).json({
        message: "El recurso no está disponible en el horario solicitado",
        conflictingReservation: availability.conflictingReservation,
        details: {
          selectedTime: formatDateForLog(startDate),
          conflictingTime: availability.conflictingReservation
            ? formatDateForLog(
                availability.conflictingReservation.startDateTime
              )
            : null,
        },
      });
    }

    if (isRepetitive) {
      if (!repeatConfig) {
        return res.status(400).json({
          message: "Para reservas repetitivas se requiere repeatConfig",
        });
      }

      const {
        frequency,
        interval = 1,
        occurrences,
        endDate: repeatEndDate,
        daysOfWeek,
      } = repeatConfig;

      if (!frequency || !["daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({
          message: "Frecuencia inválida. Use: daily, weekly o monthly",
        });
      }

      if (!occurrences && !repeatEndDate) {
        return res.status(400).json({
          message: "Especifique 'occurrences' o 'endDate' para repeticiones",
        });
      }

      if (
        frequency === "weekly" &&
        (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0)
      ) {
        return res.status(400).json({
          message: "Para repetición semanal especifique daysOfWeek [0-6]",
        });
      }

      if (occurrences && occurrences > 52) {
        return res.status(400).json({
          message: "Máximo 52 repeticiones permitidas",
        });
      }

      const repeatValidation = await validateRepeatAvailability(
        resourceId,
        startDate,
        endDate,
        repeatConfig
      );

      if (!repeatValidation.isValid) {
        return res.status(409).json({
          message: "Conflicto de disponibilidad en fechas repetitivas",
          conflicts: repeatValidation.conflicts.map((conflict) => ({
            date: conflict.startDateTime,
            conflictingReservation: conflict.conflictingReservation
              ? {
                  id: conflict.conflictingReservation.id,
                  startDateTime: conflict.conflictingReservation.startDateTime,
                  endDateTime: conflict.conflictingReservation.endDateTime,
                }
              : null,
          })),
          totalOccurrences: repeatValidation.totalOccurrences,
          availableOccurrences: repeatValidation.allDates.filter(
            (d) => d.isAvailable
          ).length,
        });
      }

      const createdReservations = [];
      const masterId = generateMasterId();
      const repeatDates = repeatValidation.allDates;

      for (let i = 0; i < repeatDates.length; i++) {
        const date = repeatDates[i];

        const repeatScheduleValidation = await validateTimeAgainstSchedule(
          resourceId,
          date.startDateTime,
          date.endDateTime
        );
        if (!repeatScheduleValidation.isValid) {
          console.warn(
            `Saltando repetición ${i + 1}:`,
            repeatScheduleValidation.message
          );
          continue;
        }

        const reservation = await Reservation.create({
          resourceId,
          userId,
          startDateTime: date.startDateTime,
          endDateTime: date.endDateTime,
          purpose,
          attendees,
          isRepetitive: true,
          status: "pendiente",
        });

        createdReservations.push({
          id: reservation.id,
          startDateTime: reservation.startDateTime,
          endDateTime: reservation.endDateTime,
          sequence: i + 1,
          status: reservation.status,
        });
      }

      if (createdReservations.length === 0) {
        return res.status(400).json({
          message: "No se pudo crear ninguna reserva repetitiva",
        });
      }

      const resourceWithDetails = await Resource.findByPk(resourceId);
      const resourceType = await ResourceType.findByPk(
        resourceWithDetails.typeId
      );
      const unit = await Unit.findByPk(resourceType.unitId);
      const user = await User.findByPk(userId, {
        attributes: ["id", "firstName", "lastName", "email"],
      });

      res.status(201).json({
        message: `Reserva repetitiva creada exitosamente (${createdReservations.length} ocurrencias)`,
        isRepetitive: true,
        masterId,
        repeatConfig,
        totalOccurrences: createdReservations.length,
        reservations: createdReservations,
        details: {
          resource: {
            ...resourceWithDetails.toJSON(),
            ResourceType: {
              ...resourceType.toJSON(),
              Unit: unit,
            },
          },
          user,
          timezoneInfo: {
            serverTimezone: "UTC",
            userTimezone: "Colombia (UTC-5)",
            createdAtColombia: adjustToColombiaFromUTC(
              new Date()
            ).toLocaleString("es-CO"),
          },
        },
      });
    } else {
      const reservation = await Reservation.create({
        resourceId,
        userId,
        startDateTime: startDate,
        endDateTime: endDate,
        purpose,
        attendees,
        isRepetitive: false,
        status: "pendiente",
      });

      const resourceWithDetails = await Resource.findByPk(resourceId);
      const resourceType = await ResourceType.findByPk(
        resourceWithDetails.typeId
      );
      const unit = await Unit.findByPk(resourceType.unitId);
      const user = await User.findByPk(userId, {
        attributes: ["id", "firstName", "lastName", "email"],
      });

      res.status(201).json({
        message: "Reserva única creada exitosamente",
        reservation: {
          ...reservation.toJSON(),
          Resource: {
            ...resourceWithDetails.toJSON(),
            ResourceType: {
              ...resourceType.toJSON(),
              Unit: unit,
            },
          },
          User: user,
        },
        timezoneInfo: {
          serverTimezone: "UTC",
          userTimezone: "Colombia (UTC-5)",
          reservationTimeColombia:
            adjustToColombiaFromUTC(startDate).toLocaleString("es-CO"),
        },
      });
    }
  } catch (error) {
    console.error("❌ Error al crear reserva:", error);
    res.status(500).json({
      message: "Error al crear la reserva",
      error: error.message,
      details:
        process.env.NODE_ENV === "development"
          ? {
              stack: error.stack,
              timezone: "Colombia (UTC-5)",
            }
          : undefined,
    });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      page = 1,
      limit = 10,
      startDate,
      endDate,
      isRepetitive,
    } = req.query;

    const whereConditions = { userId };

    if (status && status !== "all") {
      whereConditions.status = status;
    }

    if (isRepetitive !== undefined) {
      whereConditions.isRepetitive = isRepetitive === "true";
    }

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      order: [["startDateTime", "DESC"]],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

    // Obtener todas las calificaciones para estas reservas en una sola consulta
    const reservationIds = reservations.map((res) => res.id);

    let ratingsMap = new Map();
    if (reservationIds.length > 0) {
      const Rating = require("../../../../../models/Rating");
      const ratings = await Rating.findAll({
        where: {
          reservationId: {
            [Op.in]: reservationIds,
          },
        },
      });

      // Crear un mapa de reservationId -> rating para acceso rápido
      ratings.forEach((rating) => {
        ratingsMap.set(rating.reservationId, rating.toJSON());
      });
    }

    const reservationsWithDetails = await Promise.all(
      reservations.map(async (reservation) => {
        const resource = await Resource.findByPk(reservation.resourceId);
        let resourceType = null;
        let unit = null;

        if (resource) {
          resourceType = await ResourceType.findByPk(resource.typeId);
          if (resourceType) {
            unit = await Unit.findByPk(resourceType.unitId, {
              attributes: ["id", "name"],
            });
          }
        }

        // Obtener la calificación de esta reserva si existe
        const rating = ratingsMap.get(reservation.id);

        // Verificar si puede ser calificada
        const canBeRated = reservation.status === "finalizada" && !rating;
        const hasRating = !!rating;

        return {
          ...reservation.toJSON(),
          Resource: resource
            ? {
                ...resource.toJSON(),
                ResourceType: resourceType
                  ? {
                      ...resourceType.toJSON(),
                      Unit: unit,
                    }
                  : null,
              }
            : null,
          Rating: rating || null,
          canBeRated,
          hasRating,
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
    res
      .status(500)
      .json({ message: "Error al obtener las reservas: " + error.message });
  }
};

const getReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const whereConditions = { id };

    if (!["administrador", "empleado_unidad"].includes(userRole)) {
      whereConditions.userId = userId;
    }

    const reservation = await Reservation.findOne({
      where: whereConditions,
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    const resource = await Resource.findByPk(reservation.resourceId);
    let resourceType = null;
    let unit = null;
    let user = null;

    if (resource) {
      resourceType = await ResourceType.findByPk(resource.typeId);
      if (resourceType) {
        unit = await Unit.findByPk(resourceType.unitId, {
          attributes: ["id", "name"],
        });
      }
    }

    user = await User.findByPk(reservation.userId, {
      attributes: ["id", "firstName", "lastName", "email", "rol"],
    });

    // Si es repetitiva, buscar otras de la misma serie
    let repeatSeries = [];
    if (reservation.isRepetitive) {
      repeatSeries = await findRepeatSeries(
        reservation.userId,
        reservation.resourceId,
        reservation.purpose,
        reservation.startDateTime
      );
    }

    const reservationWithDetails = {
      ...reservation.toJSON(),
      Resource: resource
        ? {
            ...resource.toJSON(),
            ResourceType: resourceType
              ? {
                  ...resourceType.toJSON(),
                  Unit: unit,
                }
              : null,
          }
        : null,
      User: user,
      repeatSeries: repeatSeries
        .filter((r) => r.id !== reservation.id)
        .map((r) => ({
          id: r.id,
          startDateTime: r.startDateTime,
          endDateTime: r.endDateTime,
          status: r.status,
        })),
    };

    res.json(reservationWithDetails);
  } catch (error) {
    console.error("Error al obtener reserva:", error);
    res
      .status(500)
      .json({ message: "Error al obtener la reserva: " + error.message });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const body = req.body || {};
    const { cancelAll = false, cancelFuture = false } = body;

    console.log("🔄 Cancelando reserva:", {
      id,
      userId,
      userRole,
      cancelAll,
      cancelFuture,
      body,
    });

    const whereConditions = { id };

    if (!["administrador", "empleado_unidad"].includes(userRole)) {
      whereConditions.userId = userId;
    }

    const reservation = await Reservation.findOne({
      where: whereConditions,
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    if (reservation.status === "cancelada") {
      return res.status(400).json({ message: "La reserva ya está cancelada" });
    }

    if (reservation.status === "finalizada") {
      return res
        .status(400)
        .json({ message: "No se puede cancelar una reserva finalizada" });
    }

    // Verificar tiempo de cancelación considerando Colombia UTC-5
    const startDate = new Date(reservation.startDateTime);
    const now = new Date();

    // Ajustar a hora Colombia para la comparación
    const startDateColombia = adjustToColombiaFromUTC(startDate);
    const nowColombia = adjustToColombiaFromUTC(now);

    const timeDiff = startDateColombia - nowColombia;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < MIN_CANCEL_HOURS && userRole === "estudiante") {
      const minutesDiff = Math.floor((timeDiff / (1000 * 60)) % 60);
      return res.status(400).json({
        message: `No se puede cancelar la reserva con menos de ${MIN_CANCEL_HOURS} hora(s) de anticipación. 
                  Tiempo restante: ${Math.floor(
                    hoursDiff
                  )} horas ${minutesDiff} minutos (hora Colombia)`,
        details: {
          minCancelHours: MIN_CANCEL_HOURS,
          remainingHours: hoursDiff,
          reservationTimeColombia: startDateColombia.toLocaleString("es-CO"),
          currentTimeColombia: nowColombia.toLocaleString("es-CO"),
        },
      });
    }

    // Manejar cancelación de reservas repetitivas
    if (reservation.isRepetitive && (cancelAll || cancelFuture)) {
      const repeatSeries = await findRepeatSeries(
        reservation.userId,
        reservation.resourceId,
        reservation.purpose,
        reservation.startDateTime
      );

      let reservationsToCancel = [];

      if (cancelAll) {
        reservationsToCancel = [reservation, ...repeatSeries];
      } else if (cancelFuture) {
        const now = new Date();
        reservationsToCancel = [reservation, ...repeatSeries].filter(
          (res) => new Date(res.startDateTime) >= now
        );
      }

      const cancelPromises = reservationsToCancel.map((res) =>
        res.update({ status: "cancelada" })
      );

      await Promise.all(cancelPromises);

      return res.json({
        success: true,
        message: `${reservationsToCancel.length} reserva(s) cancelada(s) exitosamente`,
        canceledCount: reservationsToCancel.length,
        canceledAll: cancelAll,
        canceledFuture: cancelFuture,
        reservations: reservationsToCancel.map((r) => ({
          id: r.id,
          startDateTime: r.startDateTime,
          status: "cancelada",
        })),
      });
    } else {
      await reservation.update({
        status: "cancelada",
      });

      return res.json({
        success: true,
        message: "Reserva cancelada exitosamente",
        reservation: {
          id: reservation.id,
          status: "cancelada",
          canceledAtColombia: adjustToColombiaFromUTC(
            new Date()
          ).toLocaleString("es-CO"),
        },
      });
    }
  } catch (error) {
    console.error("❌ Error al cancelar reserva:", error);
    return res.status(500).json({
      success: false,
      message: "Error al cancelar la reserva: " + error.message,
    });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const {
      status,
      resourceId,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      isRepetitive,
    } = req.query;

    const whereConditions = {};

    if (status && status !== "all") {
      whereConditions.status = status;
    }

    if (resourceId) {
      whereConditions.resourceId = resourceId;
    }

    if (userId) {
      whereConditions.userId = userId;
    }

    if (isRepetitive !== undefined) {
      whereConditions.isRepetitive = isRepetitive === "true";
    }

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      order: [["startDateTime", "DESC"]],
      offset: parseInt(offset),
      limit: parseInt(limit),
    });

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
              attributes: ["id", "name"],
            });
          }
        }

        user = await User.findByPk(reservation.userId, {
          attributes: ["id", "firstName", "lastName", "email", "rol"],
        });

        return {
          ...reservation.toJSON(),
          Resource: resource
            ? {
                ...resource.toJSON(),
                ResourceType: resourceType
                  ? {
                      ...resourceType.toJSON(),
                      Unit: unit,
                    }
                  : null,
              }
            : null,
          User: user,
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
    res
      .status(500)
      .json({ message: "Error al obtener las reservas: " + error.message });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pendiente", "activa", "finalizada", "cancelada"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Estado inválido. Debe ser uno de: ${validStatuses.join(
          ", "
        )}`,
      });
    }

    const reservation = await Reservation.findByPk(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    await reservation.update({ status });

    res.json({
      message: `Estado de reserva actualizado a: ${status}`,
      reservation,
    });
  } catch (error) {
    console.error("Error al actualizar estado de reserva:", error);
    res.status(500).json({
      message: "Error al actualizar el estado de la reserva: " + error.message,
    });
  }
};

const getResourceReservations = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { startDate, endDate } = req.query;

    const whereConditions = { resourceId };

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const reservations = await Reservation.findAll({
      where: whereConditions,
      order: [["startDateTime", "ASC"]],
    });

    const reservationsWithUsers = await Promise.all(
      reservations.map(async (reservation) => {
        const user = await User.findByPk(reservation.userId, {
          attributes: ["id", "firstName", "lastName"],
        });

        return {
          ...reservation.toJSON(),
          User: user,
        };
      })
    );

    res.json(reservationsWithUsers);
  } catch (error) {
    console.error("Error al obtener reservas por recurso:", error);
    res.status(500).json({
      message: "Error al obtener las reservas del recurso: " + error.message,
    });
  }
};

const getUserReservations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate } = req.query;

    const whereConditions = { userId };

    if (status && status !== "all") {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const reservations = await Reservation.findAll({
      where: whereConditions,
      order: [["startDateTime", "DESC"]],
    });

    const reservationsWithResources = await Promise.all(
      reservations.map(async (reservation) => {
        const resource = await Resource.findByPk(reservation.resourceId);
        let resourceType = null;

        if (resource) {
          resourceType = await ResourceType.findByPk(resource.typeId, {
            attributes: ["id", "name"],
          });
        }

        return {
          ...reservation.toJSON(),
          Resource: resource
            ? {
                ...resource.toJSON(),
                ResourceType: resourceType,
              }
            : null,
        };
      })
    );

    res.json(reservationsWithResources);
  } catch (error) {
    console.error("Error al obtener reservas por usuario:", error);
    res.status(500).json({
      message: "Error al obtener las reservas del usuario: " + error.message,
    });
  }
};

// ========== CONTROLADORES DE CALENDARIO ==========

const checkResourceAvailabilityController = async (req, res) => {
  try {
    const { resourceId, startDateTime, endDateTime } = req.body;

    console.log("🔍 Verificando disponibilidad:", {
      resourceId,
      startDateTime,
      endDateTime,
      ahoraUTC: new Date().toISOString(),
      ahoraColombia: adjustToColombiaFromUTC(new Date()).toLocaleString(
        "es-CO"
      ),
    });

    if (!resourceId || !startDateTime || !endDateTime) {
      return res.status(400).json({
        message:
          "Faltan campos requeridos: resourceId, startDateTime, endDateTime",
      });
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin",
      });
    }

    // ✅ MODIFICACIÓN: Permitir verificar disponibilidad para fechas hasta ayer
    const now = new Date();
    const todayColombia = adjustToColombiaFromUTC(now);
    todayColombia.setHours(0, 0, 0, 0);

    const startDateColombia = adjustToColombiaFromUTC(startDate);
    startDateColombia.setHours(0, 0, 0, 0);

    const diffTime = todayColombia - startDateColombia;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return res.status(400).json({
        message:
          "Solo se puede verificar disponibilidad para hoy o ayer como máximo",
        isAvailable: false,
        details: {
          fechaInicioColombia: startDateColombia.toLocaleDateString("es-CO"),
          fechaHoyColombia: todayColombia.toLocaleDateString("es-CO"),
          diferenciaDias: diffDays,
          limitePermitido: "máximo 1 día antes (ayer)",
        },
      });
    }

    // Si es fecha de ayer, mostrar advertencia pero continuar
    const isYesterday = diffDays === 1;

    if (isYesterday) {
      console.log("⚠️ Verificando disponibilidad para fecha pasada (ayer)");
    }

    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true,
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Recurso no encontrado",
        isAvailable: false,
      });
    }

    const scheduleValidation = await validateTimeAgainstSchedule(
      resourceId,
      startDate,
      endDate
    );
    if (!scheduleValidation.isValid) {
      return res.status(400).json({
        message: scheduleValidation.message,
        isAvailable: false,
      });
    }

    const availability = await checkResourceAvailability(
      resourceId,
      startDate,
      endDate
    );

    res.json({
      isAvailable: availability.isAvailable && scheduleValidation.isValid,
      message:
        availability.isAvailable && scheduleValidation.isValid
          ? "El recurso está disponible en el horario solicitado"
          : "El recurso no está disponible en el horario solicitado",
      conflictingReservation: availability.conflictingReservation,
      isPastDate: isYesterday,
      warning: isYesterday
        ? "⚠️ Verificando disponibilidad para fecha pasada (ayer)"
        : null,
      details: {
        selectedTimeColombia:
          adjustToColombiaFromUTC(startDate).toLocaleString("es-CO"),
        selectedTimeUTC: startDate.toISOString(),
        serverTimeColombia: adjustToColombiaFromUTC(new Date()).toLocaleString(
          "es-CO"
        ),
        isYesterday: isYesterday,
        timezone: "Colombia (UTC-5)",
      },
    });
  } catch (error) {
    console.error("Error en checkResourceAvailability:", error);
    res.status(500).json({
      message: "Error al verificar disponibilidad",
      isAvailable: false,
      error: error.message,
      details:
        process.env.NODE_ENV === "development"
          ? {
              stack: error.stack,
              timezone: "Colombia (UTC-5)",
            }
          : undefined,
    });
  }
};

const getResourceAvailability = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;
    console.log("fecha recibida:", date);

    if (!resourceId || !date) {
      return res.status(400).json({
        message: "Faltan parámetros: resourceId y date",
      });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        message: "Formato de fecha inválido. Use YYYY-MM-DD",
      });
    }

    // ✅ MODIFICACIÓN: Permitir fechas hasta 1 día antes (ayer)
    const now = new Date();
    const todayColombia = adjustToColombiaFromUTC(now);
    todayColombia.setHours(0, 0, 0, 0);

    const targetDateColombia = adjustToColombiaFromUTC(targetDate);
    targetDateColombia.setHours(0, 0, 0, 0);

    // Calcular diferencia en días
    const diffTime = todayColombia - targetDateColombia;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log("📅 Validación de fecha:", {
      hoyColombia: todayColombia.toLocaleDateString("es-CO"),
      fechaSolicitadaColombia: targetDateColombia.toLocaleDateString("es-CO"),
      diferenciaDias: diffDays,
      esPasado: diffDays > 0,
    });

    // Permitir fechas hasta 1 día antes (ayer)
    if (diffDays > 1) {
      return res.status(400).json({
        message:
          "Solo se puede consultar disponibilidad para hoy o ayer como máximo",
        details: {
          fechaSolicitada: targetDateColombia.toLocaleDateString("es-CO"),
          fechaHoy: todayColombia.toLocaleDateString("es-CO"),
          diferenciaDias: diffDays,
          limitePermitido: "máximo 1 día antes (ayer)",
        },
      });
    }

    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true,
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Recurso no encontrado",
      });
    }

    const resourceType = await ResourceType.findByPk(resource.typeId, {
      attributes: ["id", "name", "granularity"],
    });

    const availableSlots = await generateAvailableSlots(resourceId, date);

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await Reservation.findAll({
      where: {
        resourceId,
        startDateTime: {
          [Op.between]: [startOfDay, endOfDay],
        },
        status: {
          [Op.in]: ["pendiente", "activa"],
        },
      },
      attributes: [
        "id",
        "startDateTime",
        "endDateTime",
        "purpose",
        "isRepetitive",
      ],
      order: [["startDateTime", "ASC"]],
    });

    const reservationsWithUsers = await Promise.all(
      reservations.map(async (reservation) => {
        const user = await User.findByPk(reservation.userId, {
          attributes: ["firstName", "lastName"],
        });

        return {
          id: reservation.id,
          start: reservation.startDateTime,
          end: reservation.endDateTime,
          purpose: reservation.purpose,
          isRepetitive: reservation.isRepetitive,
          user: user ? `${user.firstName} ${user.lastName}` : "Usuario",
        };
      })
    );

    // Determinar si la fecha es pasada para mostrar advertencia
    const isPastDate = diffDays === 1; // 1 día de diferencia = ayer

    res.json({
      date: targetDate.toISOString().split("T")[0],
      dateColombia:
        adjustToColombiaFromUTC(targetDate).toLocaleDateString("es-CO"),
      isPastDate: isPastDate,
      warning: isPastDate
        ? "⚠️ Consultando disponibilidad para fecha pasada (ayer)"
        : null,
      resource: {
        id: resource.id,
        name: resource.name,
        type: resourceType ? resourceType.name : "Desconocido",
        granularity: resourceType ? resourceType.granularity : 30,
      },
      availableSlots,
      existingReservations: reservationsWithUsers,
      summary: {
        totalSlots: availableSlots.length,
        availableSlots: availableSlots.filter((slot) => slot.isAvailable)
          .length,
        occupiedSlots: availableSlots.filter((slot) => !slot.isAvailable)
          .length,
        repetitiveReservations: reservations.filter((r) => r.isRepetitive)
          .length,
      },
      timezoneInfo: {
        serverTimezone: "UTC",
        colombiaTimezone: "UTC-5",
        queryDateColombia:
          adjustToColombiaFromUTC(targetDate).toLocaleString("es-CO"),
        todayColombia: todayColombia.toLocaleDateString("es-CO"),
        isYesterday: isPastDate,
      },
    });
  } catch (error) {
    console.error("Error en getResourceAvailability:", error);
    res.status(500).json({
      message: "Error al obtener disponibilidad",
      error: error.message,
    });
  }
};

const getResourceAvailabilityRange = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { startDate, endDate } = req.query;

    if (!resourceId || !startDate || !endDate) {
      return res.status(400).json({
        message: "Faltan parámetros: resourceId, startDate y endDate",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin",
      });
    }

    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true,
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Recurso no encontrado",
      });
    }

    const availabilityByDay = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split("T")[0];

      try {
        const slots = await generateAvailableSlots(resourceId, dateStr);
        const availableCount = slots.filter((slot) => slot.isAvailable).length;

        availabilityByDay.push({
          date: dateStr,
          dateColombia:
            adjustToColombiaFromUTC(currentDate).toLocaleDateString("es-CO"),
          dayOfWeek: currentDate.toLocaleDateString("es-ES", {
            weekday: "long",
          }),
          available: availableCount > 0,
          availableSlots: availableCount,
          totalSlots: slots.length,
        });
      } catch (error) {
        availabilityByDay.push({
          date: dateStr,
          dateColombia:
            adjustToColombiaFromUTC(currentDate).toLocaleDateString("es-CO"),
          dayOfWeek: currentDate.toLocaleDateString("es-ES", {
            weekday: "long",
          }),
          available: false,
          availableSlots: 0,
          totalSlots: 0,
          error: error.message,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      resource: {
        id: resource.id,
        name: resource.name,
      },
      dateRange: {
        start: startDate,
        end: endDate,
        startColombia:
          adjustToColombiaFromUTC(start).toLocaleDateString("es-CO"),
        endColombia: adjustToColombiaFromUTC(end).toLocaleDateString("es-CO"),
      },
      availabilityByDay,
      summary: {
        totalDays: availabilityByDay.length,
        availableDays: availabilityByDay.filter((day) => day.available).length,
        totalAvailableSlots: availabilityByDay.reduce(
          (sum, day) => sum + day.availableSlots,
          0
        ),
      },
      timezoneInfo: {
        serverTimezone: "UTC",
        colombiaTimezone: "UTC-5",
      },
    });
  } catch (error) {
    console.error("Error en getResourceAvailabilityRange:", error);
    res.status(500).json({
      message: "Error al obtener disponibilidad en rango",
      error: error.message,
    });
  }
};

// ========== FUNCIONES ESPECÍFICAS PARA RESERVAS REPETITIVAS ==========

const checkRepeatAvailability = async (req, res) => {
  try {
    const { resourceId, startDateTime, endDateTime, repeatConfig } = req.body;

    if (!resourceId || !startDateTime || !endDateTime || !repeatConfig) {
      return res.status(400).json({
        message: "Faltan campos requeridos",
      });
    }

    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    if (startDate >= endDate) {
      return res.status(400).json({
        message: "La fecha de inicio debe ser anterior a la fecha de fin",
      });
    }

    // ✅ CORRECCIÓN: Validar primera fecha considerando Colombia UTC-5
    if (isPastInColombia(startDate, MIN_BOOKING_MINUTES)) {
      const minutesFromNow = getMinutesFromNowColombia(startDate);
      return res.status(400).json({
        message: `La primera fecha de la repetición es pasada. 
                  Por favor selecciona una fecha al menos ${MIN_BOOKING_MINUTES} minutos en el futuro.`,
        isAvailable: false,
        details: {
          firstDateColombia:
            adjustToColombiaFromUTC(startDate).toLocaleString("es-CO"),
          differenceMinutes: minutesFromNow,
          timezone: "Colombia (UTC-5)",
        },
      });
    }

    const resource = await Resource.findOne({
      where: {
        id: resourceId,
        isActive: true,
      },
    });

    if (!resource) {
      return res.status(404).json({
        message: "Recurso no encontrado",
      });
    }

    const repeatValidation = await validateRepeatAvailability(
      resourceId,
      startDate,
      endDate,
      repeatConfig
    );

    res.json({
      isAvailable: repeatValidation.isValid,
      totalOccurrences: repeatValidation.totalOccurrences,
      availableOccurrences: repeatValidation.allDates.filter(
        (d) => d.isAvailable
      ).length,
      conflicts: repeatValidation.conflicts.map((conflict) => ({
        date: conflict.startDateTime,
        dateColombia: adjustToColombiaFromUTC(
          conflict.startDateTime
        ).toLocaleString("es-CO"),
        hasConflict: true,
      })),
      allDates: repeatValidation.allDates.map((date) => ({
        date: date.startDateTime,
        dateColombia: adjustToColombiaFromUTC(
          date.startDateTime
        ).toLocaleString("es-CO"),
        isAvailable: date.isAvailable,
        sequence: date.sequence,
      })),
      timezoneInfo: {
        serverTimezone: "UTC",
        colombiaTimezone: "UTC-5",
      },
    });
  } catch (error) {
    console.error("Error en checkRepeatAvailability:", error);
    res.status(500).json({
      message: "Error al verificar disponibilidad repetitiva",
      error: error.message,
    });
  }
};

const getRepeatSeries = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.rol;

    const repeatReservations = await Reservation.findAll({
      where: {
        isRepetitive: true,
        ...(userRole !== "administrador" && userRole !== "empleado_unidad"
          ? { userId }
          : {}),
        status: { [Op.in]: ["pendiente", "activa"] },
      },
      order: [["startDateTime", "ASC"]],
    });

    const seriesMap = new Map();

    for (const reservation of repeatReservations) {
      const key = `${reservation.userId}_${reservation.resourceId}_${reservation.purpose}`;

      if (!seriesMap.has(key)) {
        seriesMap.set(key, []);
      }

      seriesMap.get(key).push(reservation);
    }

    const seriesDetails = [];

    for (const [key, reservations] of seriesMap) {
      if (reservations.length < 2) continue;

      const firstReservation = reservations[0];

      const timeDiffs = [];
      for (let i = 1; i < reservations.length; i++) {
        const diff =
          new Date(reservations[i].startDateTime) -
          new Date(reservations[i - 1].startDateTime);
        timeDiffs.push(diff);
      }

      const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      const isConsistent = timeDiffs.every(
        (diff) => Math.abs(diff - avgDiff) < 24 * 60 * 60 * 1000
      );

      const resource = await Resource.findByPk(firstReservation.resourceId);
      const resourceType = resource
        ? await ResourceType.findByPk(resource.typeId)
        : null;
      const unit = resourceType
        ? await Unit.findByPk(resourceType.unitId)
        : null;

      seriesDetails.push({
        seriesKey: key,
        resource: resource
          ? {
              id: resource.id,
              name: resource.name,
              type: resourceType ? resourceType.name : null,
              unit: unit ? unit.name : null,
            }
          : null,
        purpose: firstReservation.purpose,
        totalOccurrences: reservations.length,
        firstDate: firstReservation.startDateTime,
        firstDateColombia: adjustToColombiaFromUTC(
          firstReservation.startDateTime
        ).toLocaleString("es-CO"),
        lastDate: reservations[reservations.length - 1].startDateTime,
        lastDateColombia: adjustToColombiaFromUTC(
          reservations[reservations.length - 1].startDateTime
        ).toLocaleString("es-CO"),
        patternDetected: isConsistent,
        estimatedFrequency: isConsistent
          ? avgDiff === 7 * 24 * 60 * 60 * 1000
            ? "weekly"
            : avgDiff === 24 * 60 * 60 * 1000
            ? "daily"
            : "custom"
          : "unknown",
        nextReservation: reservations.find(
          (r) =>
            new Date(r.startDateTime) > new Date() && r.status === "pendiente"
        ),
        reservations: reservations.map((r) => ({
          id: r.id,
          startDateTime: r.startDateTime,
          startDateTimeColombia: adjustToColombiaFromUTC(
            r.startDateTime
          ).toLocaleString("es-CO"),
          endDateTime: r.endDateTime,
          status: r.status,
        })),
      });
    }

    res.json({
      series: seriesDetails,
      totalSeries: seriesDetails.length,
      timezoneInfo: {
        serverTimezone: "UTC",
        colombiaTimezone: "UTC-5",
        processedAtColombia: adjustToColombiaFromUTC(new Date()).toLocaleString(
          "es-CO"
        ),
      },
    });
  } catch (error) {
    console.error("Error al obtener series repetitivas:", error);
    res.status(500).json({
      message: "Error al obtener las series de reservas",
      error: error.message,
    });
  }
};

// ========== EXPORTAR CONTROLADORES ==========

module.exports = {
  // Controladores principales
  createReservation,
  getMyReservations,
  getReservation,
  cancelReservation,
  getAllReservations,
  updateReservationStatus,
  getResourceReservations,
  getUserReservations,

  // Controladores de calendario
  checkResourceAvailability: checkResourceAvailabilityController,
  getResourceAvailability,
  getResourceAvailabilityRange,

  // Controladores específicos para reservas repetitivas
  checkRepeatAvailability,
  getRepeatSeries,

  // Funciones helpers (opcional para testing)
};
