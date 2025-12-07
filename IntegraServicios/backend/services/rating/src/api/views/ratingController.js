const Rating = require("../../../../../models/Rating");
const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Return = require("../../../../../models/Return");
const Loan = require("../../../../../models/Loan");
const User = require("../../../../../models/user");
const { Op } = require("sequelize");

const ratingController = {
  // ========== CREAR CALIFICACIÓN ==========

  createRating: async (req, res) => {
    try {
      const {
        reservationId,
        scheduleCompliance,
        resourceQuality,
        staffKindness,
        comment,
      } = req.body;
      const userId = req.user.id; // El usuario que califica

      // Validaciones
      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: "El ID de la reserva es requerido",
        });
      }

      // Validar que se proporcionen las 3 calificaciones requeridas
      if (
        scheduleCompliance === undefined ||
        resourceQuality === undefined ||
        staffKindness === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Se requieren las 3 calificaciones: cumplimiento de horarios, calidad del recurso y amabilidad del personal",
        });
      }

      // Validar rango de estrellas (0-5)
      const ratings = [scheduleCompliance, resourceQuality, staffKindness];
      for (const rating of ratings) {
        if (rating < 0 || rating > 5) {
          return res.status(400).json({
            success: false,
            message: "Las calificaciones deben estar entre 0 y 5 estrellas",
          });
        }
      }

      // Verificar que la reserva existe y pertenece al usuario
      const reservation = await Reservation.findOne({
        where: {
          id: reservationId,
          userId: userId,
        },
        include: [
          {
            model: Resource,
            attributes: ["id", "name"],
            include: [
              {
                model: ResourceType,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reserva no encontrada o no pertenece al usuario",
        });
      }

      // Verificar que la reserva esté finalizada
      if (reservation.status !== "finalizada") {
        return res.status(400).json({
          success: false,
          message: "Solo se pueden calificar reservas finalizadas",
        });
      }

      // Verificar que exista el préstamo y la devolución
      const loan = await Loan.findOne({
        where: { reservationId },
        include: [
          {
            model: Return,
            required: true, // Solo si tiene devolución
          },
        ],
      });

      if (!loan || !loan.Return) {
        return res.status(400).json({
          success: false,
          message:
            "La reserva debe tener un préstamo y devolución registrados para poder calificar",
        });
      }

      // Verificar que no exista ya una calificación
      const existingRating = await Rating.findOne({
        where: { reservationId },
      });

      if (existingRating) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una calificación para esta reserva",
        });
      }

      // Calcular promedio
      const averageStars = (
        (scheduleCompliance + resourceQuality + staffKindness) /
        3
      ).toFixed(2);

      // Crear la calificación
      const rating = await Rating.create({
        reservationId,
        userId,
        scheduleCompliance,
        resourceQuality,
        staffKindness,
        averageStars: parseFloat(averageStars),
        comment: comment || null,
      });

      // Obtener detalles completos para respuesta
      const ratingWithDetails = await Rating.findByPk(rating.id, {
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "endDateTime", "purpose"],
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: "Calificación registrada exitosamente",
        rating: ratingWithDetails,
      });
    } catch (err) {
      console.error("❌ Error al crear calificación:", err);

      if (err.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Reserva o usuario no válido",
        });
      }

      if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: err.errors.map((e) => e.message).join(", "),
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al registrar la calificación",
        error: err.message,
      });
    }
  },

  // ========== OBTENER TODAS LAS CALIFICACIONES ==========

  getRatings: async (req, res) => {
    try {
      const ratings = await Rating.findAll({
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "purpose"],
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      res.json({
        success: true,
        ratings,
        total: ratings.length,
      });
    } catch (err) {
      console.error("❌ Error al obtener calificaciones:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones",
        error: err.message,
      });
    }
  },

  // ========== OBTENER CALIFICACIONES PAGINADAS ==========

  getRatingsPaginated: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        minStars,
        maxStars,
        startDate,
        endDate,
        resourceId,
        userId,
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};
      const reservationWhere = {};

      // Filtros
      if (minStars !== undefined) {
        whereConditions.averageStars = whereConditions.averageStars || {};
        whereConditions.averageStars[Op.gte] = parseFloat(minStars);
      }

      if (maxStars !== undefined) {
        whereConditions.averageStars = whereConditions.averageStars || {};
        whereConditions.averageStars[Op.lte] = parseFloat(maxStars);
      }

      if (userId) {
        whereConditions.userId = userId;
      }

      if (resourceId) {
        reservationWhere.resourceId = resourceId;
      }

      // Filtro por fecha de la reserva
      if (startDate && endDate) {
        reservationWhere.startDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const { count, rows: ratings } = await Rating.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "endDateTime", "purpose"],
            where:
              Object.keys(reservationWhere).length > 0
                ? reservationWhere
                : undefined,
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
        offset: parseInt(offset),
        limit: parseInt(limit),
        distinct: true,
      });

      res.json({
        success: true,
        ratings,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (err) {
      console.error("❌ Error al paginar calificaciones:", err);
      res.status(500).json({
        success: false,
        message: "Error al paginar calificaciones",
        error: err.message,
      });
    }
  },

  // ========== OBTENER UNA CALIFICACIÓN ESPECÍFICA ==========

  getRating: async (req, res) => {
    try {
      const { id } = req.params;

      const rating = await Rating.findByPk(id, {
        include: [
          {
            model: Reservation,
            attributes: [
              "id",
              "startDateTime",
              "endDateTime",
              "purpose",
              "status",
            ],
            include: [
              {
                model: Resource,
                attributes: ["id", "name", "photoUrl"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name", "description"],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
        ],
      });

      if (!rating) {
        return res.status(404).json({
          success: false,
          message: "Calificación no encontrada",
        });
      }

      res.json({
        success: true,
        rating,
      });
    } catch (err) {
      console.error("❌ Error al obtener calificación:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener calificación",
        error: err.message,
      });
    }
  },

  // ========== ACTUALIZAR UNA CALIFICACIÓN ==========

  updateRating: async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduleCompliance, resourceQuality, staffKindness, comment } =
        req.body;
      const userId = req.user.id;

      const rating = await Rating.findByPk(id, {
        include: [
          {
            model: Reservation,
            attributes: ["userId"],
          },
        ],
      });

      if (!rating) {
        return res.status(404).json({
          success: false,
          message: "Calificación no encontrada",
        });
      }

      // Verificar que el usuario sea el propietario de la calificación o admin
      if (
        rating.Reservation.userId !== userId &&
        req.user.rol !== "administrador"
      ) {
        return res.status(403).json({
          success: false,
          message: "No tienes permiso para actualizar esta calificación",
        });
      }

      const updateData = {};

      // Actualizar calificaciones individuales
      if (scheduleCompliance !== undefined) {
        if (scheduleCompliance < 0 || scheduleCompliance > 5) {
          return res.status(400).json({
            success: false,
            message: "La calificación debe estar entre 0 y 5 estrellas",
          });
        }
        updateData.scheduleCompliance = scheduleCompliance;
      }

      if (resourceQuality !== undefined) {
        if (resourceQuality < 0 || resourceQuality > 5) {
          return res.status(400).json({
            success: false,
            message: "La calificación debe estar entre 0 y 5 estrellas",
          });
        }
        updateData.resourceQuality = resourceQuality;
      }

      if (staffKindness !== undefined) {
        if (staffKindness < 0 || staffKindness > 5) {
          return res.status(400).json({
            success: false,
            message: "La calificación debe estar entre 0 y 5 estrellas",
          });
        }
        updateData.staffKindness = staffKindness;
      }

      if (comment !== undefined) {
        updateData.comment = comment;
      }

      // Recalcular promedio si cambió alguna calificación
      if (
        scheduleCompliance !== undefined ||
        resourceQuality !== undefined ||
        staffKindness !== undefined
      ) {
        const newSchedule =
          scheduleCompliance !== undefined
            ? scheduleCompliance
            : rating.scheduleCompliance;
        const newQuality =
          resourceQuality !== undefined
            ? resourceQuality
            : rating.resourceQuality;
        const newKindness =
          staffKindness !== undefined ? staffKindness : rating.staffKindness;

        updateData.averageStars = parseFloat(
          ((newSchedule + newQuality + newKindness) / 3).toFixed(2)
        );
      }

      // Realizar la actualización
      await rating.update(updateData);

      res.json({
        success: true,
        message: "Calificación actualizada exitosamente",
        rating: await Rating.findByPk(id, {
          include: [
            {
              model: User,
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        }),
      });
    } catch (err) {
      console.error("❌ Error al actualizar calificación:", err);

      if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: err.errors.map((e) => e.message).join(", "),
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar calificación",
        error: err.message,
      });
    }
  },

  // ========== ELIMINAR UNA CALIFICACIÓN ==========

  deleteRating: async (req, res) => {
    try {
      const { id } = req.params;

      const rating = await Rating.findByPk(id, {
        include: [
          {
            model: Reservation,
            attributes: ["id"],
          },
        ],
      });

      if (!rating) {
        return res.status(404).json({
          success: false,
          message: "Calificación no encontrada",
        });
      }

      // Eliminar la calificación
      await rating.destroy();

      res.json({
        success: true,
        message: "Calificación eliminada exitosamente",
        deletedRating: {
          id,
          reservationId: rating.reservationId,
          averageStars: rating.averageStars,
        },
      });
    } catch (err) {
      console.error("❌ Error al eliminar calificación:", err);
      res.status(500).json({
        success: false,
        message: "Error al eliminar calificación",
        error: err.message,
      });
    }
  },

  // ========== ESTADÍSTICAS DE CALIFICACIONES ==========

  getRatingStats: async (req, res) => {
    try {
      const { startDate, endDate, resourceId } = req.query;

      const whereConditions = {};
      const reservationWhere = {};

      if (resourceId) {
        reservationWhere.resourceId = resourceId;
      }

      if (startDate && endDate) {
        reservationWhere.startDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Obtener todas las calificaciones con filtros
      const ratings = await Rating.findAll({
        where: whereConditions,
        include: [
          {
            model: Reservation,
            attributes: ["id", "resourceId", "startDateTime"],
            where:
              Object.keys(reservationWhere).length > 0
                ? reservationWhere
                : undefined,
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
      });

      const total = ratings.length;

      if (total === 0) {
        return res.json({
          success: true,
          stats: {
            total: 0,
            averages: {
              overall: 0,
              scheduleCompliance: 0,
              resourceQuality: 0,
              staffKindness: 0,
            },
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 },
          },
        });
      }

      // Calcular promedios
      const sumSchedule = ratings.reduce(
        (sum, r) => sum + r.scheduleCompliance,
        0
      );
      const sumQuality = ratings.reduce((sum, r) => sum + r.resourceQuality, 0);
      const sumKindness = ratings.reduce((sum, r) => sum + r.staffKindness, 0);
      const sumOverall = ratings.reduce((sum, r) => sum + r.averageStars, 0);

      // Distribución por estrellas (basado en promedio redondeado)
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
      ratings.forEach((r) => {
        const rounded = Math.round(r.averageStars);
        distribution[rounded]++;
      });

      // Calificaciones por recurso
      const byResource = {};
      ratings.forEach((r) => {
        const resourceId = r.Reservation.Resource.id;
        const resourceName = r.Reservation.Resource.name;

        if (!byResource[resourceId]) {
          byResource[resourceId] = {
            resourceId,
            resourceName,
            typeName: r.Reservation.Resource.ResourceType.name,
            count: 0,
            totalStars: 0,
          };
        }

        byResource[resourceId].count++;
        byResource[resourceId].totalStars += r.averageStars;
      });

      const resourceStats = Object.values(byResource)
        .map((r) => ({
          ...r,
          averageStars: (r.totalStars / r.count).toFixed(2),
        }))
        .sort((a, b) => b.averageStars - a.averageStars);

      res.json({
        success: true,
        stats: {
          total,
          averages: {
            overall: (sumOverall / total).toFixed(2),
            scheduleCompliance: (sumSchedule / total).toFixed(2),
            resourceQuality: (sumQuality / total).toFixed(2),
            staffKindness: (sumKindness / total).toFixed(2),
          },
          distribution,
          byResource: resourceStats,
        },
        dateRange:
          startDate && endDate
            ? {
                start: startDate,
                end: endDate,
              }
            : null,
      });
    } catch (err) {
      console.error("❌ Error al obtener estadísticas de calificaciones:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: err.message,
      });
    }
  },

  // ========== OBTENER CALIFICACIONES POR RESERVA ==========

  getRatingsByReservation: async (req, res) => {
    try {
      const { reservationId } = req.params;

      const ratings = await Rating.findAll({
        where: { reservationId },
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json({
        success: true,
        ratings,
        reservationId,
        count: ratings.length,
      });
    } catch (err) {
      console.error("❌ Error al obtener calificaciones por reserva:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones",
        error: err.message,
      });
    }
  },

  // ========== OBTENER CALIFICACIONES POR USUARIO ==========

  getRatingsByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const whereConditions = { userId };
      const reservationWhere = {};

      if (startDate && endDate) {
        reservationWhere.startDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const ratings = await Rating.findAll({
        where: whereConditions,
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "purpose"],
            where:
              Object.keys(reservationWhere).length > 0
                ? reservationWhere
                : undefined,
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Obtener información del usuario
      const user = await User.findByPk(userId, {
        attributes: ["id", "firstName", "lastName", "email"],
      });

      // Calcular promedio del usuario
      const avgStars =
        ratings.length > 0
          ? (
              ratings.reduce((sum, r) => sum + r.averageStars, 0) /
              ratings.length
            ).toFixed(2)
          : 0;

      res.json({
        success: true,
        user: user || { id: userId, name: "Usuario no encontrado" },
        ratings,
        statistics: {
          total: ratings.length,
          averageStars: avgStars,
        },
      });
    } catch (err) {
      console.error("❌ Error al obtener calificaciones por usuario:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones del usuario",
        error: err.message,
      });
    }
  },

  // ========== OBTENER CALIFICACIONES POR RECURSO ==========

  getRatingsByResource: async (req, res) => {
    try {
      const { resourceId } = req.params;
      const { startDate, endDate } = req.query;

      const reservationWhere = { resourceId };

      if (startDate && endDate) {
        reservationWhere.startDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const ratings = await Rating.findAll({
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "purpose"],
            where: reservationWhere,
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: User,
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Obtener información del recurso
      const resource = await Resource.findByPk(resourceId, {
        attributes: ["id", "name", "photoUrl"],
        include: [
          {
            model: ResourceType,
            attributes: ["id", "name"],
          },
        ],
      });

      // Calcular promedio del recurso
      const avgStars =
        ratings.length > 0
          ? (
              ratings.reduce((sum, r) => sum + r.averageStars, 0) /
              ratings.length
            ).toFixed(2)
          : 0;

      res.json({
        success: true,
        resource: resource || { id: resourceId, name: "Recurso no encontrado" },
        ratings,
        statistics: {
          total: ratings.length,
          averageStars: avgStars,
          averageScheduleCompliance:
            ratings.length > 0
              ? (
                  ratings.reduce((sum, r) => sum + r.scheduleCompliance, 0) /
                  ratings.length
                ).toFixed(2)
              : 0,
          averageResourceQuality:
            ratings.length > 0
              ? (
                  ratings.reduce((sum, r) => sum + r.resourceQuality, 0) /
                  ratings.length
                ).toFixed(2)
              : 0,
          averageStaffKindness:
            ratings.length > 0
              ? (
                  ratings.reduce((sum, r) => sum + r.staffKindness, 0) /
                  ratings.length
                ).toFixed(2)
              : 0,
        },
      });
    } catch (err) {
      console.error("❌ Error al obtener calificaciones por recurso:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener calificaciones del recurso",
        error: err.message,
      });
    }
  },
};

module.exports = ratingController;
