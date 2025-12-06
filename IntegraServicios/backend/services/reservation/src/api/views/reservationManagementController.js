const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const User = require("../../../../../models/user");
const Loan = require("../../../../../models/Loan");
const Rating = require("../../../../../models/Rating");
const Return = require("../../../../../models/Return");
const { Op } = require("sequelize");

const reservationManagementController = {
  // ========== DASHBOARD Y ESTADÍSTICAS ==========

  getReservationDashboard: async (req, res) => {
    try {
      console.log("📊 Dashboard llamado");

      // Estadísticas básicas
      const totalReservations = await Reservation.count();

      const reservationsByStatus = await Reservation.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["status"],
      });

      const byStatus = reservationsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.dataValues.count);
        return acc;
      }, {});

      // Reservas recientes con joins seguros
      const recentReservations = await Reservation.findAll({
        order: [["createdAt", "DESC"]],
        limit: 10,
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
          {
            model: Resource,
            attributes: ["id", "name", "photoUrl"],
            include: [
              {
                model: ResourceType,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      const dashboardData = {
        summary: {
          totalReservations,
          byStatus,
          uniqueUsers: await User.count(),
        },
        recentReservations: recentReservations.map((r) => ({
          id: r.id,
          startDateTime: r.startDateTime,
          endDateTime: r.endDateTime,
          status: r.status,
          purpose: r.purpose,
          user: {
            id: r.User.id,
            name: `${r.User.firstName} ${r.User.lastName}`,
            email: r.User.email,
            rol: r.User.rol,
          },
          resource: {
            id: r.Resource.id,
            name: r.Resource.name,
            type: r.Resource.ResourceType ? r.Resource.ResourceType.name : null,
          },
        })),
      };

      res.json({
        success: true,
        dashboard: dashboardData,
      });
    } catch (error) {
      console.error("❌ Error en getReservationDashboard:", error);
      res.status(500).json({
        success: false,
        message: "Error al cargar el dashboard",
        error: error.message,
      });
    }
  },

  // ========== GESTIÓN COMPLETA DE RESERVAS ==========

  getAllReservationsWithDetails: async (req, res) => {
    try {
      const {
        status,
        resourceId,
        userId,
        startDate,
        endDate,
        isRepetitive,
        page = 1,
        limit = 10,
        sortBy = "startDateTime",
        sortOrder = "DESC",
      } = req.query;

      console.log("📋 Reservas detalladas llamadas con filtros:", {
        status,
        resourceId,
        userId,
        startDate,
        endDate,
        isRepetitive,
        page,
        limit,
      });

      const whereConditions = {};

      // Filtros
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

      // CONSULTA SEGURA - solo campos que existen
      const { count, rows: reservations } = await Reservation.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
          {
            model: Resource,
            attributes: ["id", "name", "photoUrl", "isAvailable", "isActive"],
            include: [
              {
                model: ResourceType,
                attributes: ["id", "name"],
                include: [
                  {
                    model: Unit,
                    attributes: [
                      "id",
                      "name",
                      "description",
                      "granularity",
                      "isActive",
                    ],
                  },
                ],
              },
            ],
          },
        ],
        order: [[sortBy, sortOrder]],
        offset: parseInt(offset),
        limit: parseInt(limit),
        distinct: true,
      });

      res.json({
        success: true,
        reservations: reservations.map((r) => r.toJSON()),
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("❌ Error en getAllReservationsWithDetails:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener las reservas",
        error: error.message,
      });
    }
  },

  // ========== NUEVO ENDPOINT PARA PRÉSTAMOS ==========

  getActiveReservationsForLoans: async (req, res) => {
    try {
      const {
        resourceId,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = req.query;

      console.log(
        "✅ Obteniendo reservas activas para préstamos con filtros:",
        {
          resourceId,
          userId,
          startDate,
          endDate,
          page,
          limit,
        }
      );

      // SOLO RESERVAS ACTIVAS
      const whereConditions = {
        status: "activa",
      };

      // Filtros adicionales
      if (resourceId) {
        whereConditions.resourceId = resourceId;
      }

      if (userId) {
        whereConditions.userId = userId;
      }

      if (startDate && endDate) {
        whereConditions.startDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Obtener IDs de reservas que ya tienen préstamo registrado
      // CORRECCIÓN: Solo verificar si existe el préstamo, sin consultar status
      const existingLoans = await Loan.findAll({
        attributes: ["reservationId"],
        where: {
          // Si Loan NO tiene campo status, solo consultamos por existencia
          reservationId: { [Op.not]: null },
        },
      });

      const loanedReservationIds = existingLoans.map(
        (loan) => loan.reservationId
      );

      // Excluir reservas que ya tienen préstamo
      if (loanedReservationIds.length > 0) {
        whereConditions.id = { [Op.notIn]: loanedReservationIds };
      }

      const offset = (page - 1) * limit;

      const { count, rows: reservations } = await Reservation.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            attributes: [
              "id",
              "firstName",
              "lastName",
              "email",
              "rol",
              "identificationNumber",
            ],
          },
          {
            model: Resource,
            attributes: ["id", "name", "photoUrl", "features"],
            include: [
              {
                model: ResourceType,
                attributes: ["id", "name", "description", "granularity"],
                include: [
                  {
                    model: Unit,
                    attributes: ["id", "name", "description"],
                  },
                ],
              },
            ],
          },
          // Incluir préstamo si existe
          {
            model: Loan,
            as: "Loan",
            attributes: ["id", "deliveryTime", "hasFailure", "employeeId"],
            required: false, // LEFT JOIN, no INNER JOIN
            include: [
              {
                model: User,
                as: "Employee",
                attributes: ["id", "firstName", "lastName"],
                required: false,
              },
            ],
          },
        ],
        order: [["startDateTime", "ASC"]],
        offset: parseInt(offset),
        limit: parseInt(limit),
        distinct: true,
      });

      // Filtrar para asegurar que no tengan préstamo registrado
      // Si el préstamo tiene deliveryTime, significa que ya fue entregado
      const filteredReservations = reservations.filter(
        (reservation) => !reservation.Loan || !reservation.Loan.deliveryTime
      );

      // Calcular tiempos para cada reserva
      const now = new Date();
      const reservationsWithTimeInfo = filteredReservations.map(
        (reservation) => {
          const reservationData = reservation.toJSON();
          const startTime = new Date(reservation.startDateTime);
          const timeDiff = (startTime - now) / (1000 * 60); // minutos

          // Determinar si está dentro del lapso de entrega (±5 minutos)
          const withinDeliveryWindow = timeDiff <= 5 && timeDiff >= -5;

          return {
            ...reservationData,
            canRegisterPickup: withinDeliveryWindow,
            timeUntilStart: Math.round(timeDiff),
            pickupStatus: reservation.Loan ? "has_loan" : "pending",
            isOverdue: timeDiff < -5,
            deliveryWindow: {
              start: new Date(startTime.getTime() - 5 * 60000).toISOString(),
              end: new Date(startTime.getTime() + 5 * 60000).toISOString(),
              currentTime: now.toISOString(),
            },
          };
        }
      );

      res.json({
        success: true,
        reservations: reservationsWithTimeInfo,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
          availableForPickup: reservationsWithTimeInfo.filter(
            (r) => r.canRegisterPickup
          ).length,
          overdue: reservationsWithTimeInfo.filter((r) => r.isOverdue).length,
          availableCount: filteredReservations.length,
        },
      });
    } catch (error) {
      console.error("❌ Error en getActiveReservationsForLoans:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener reservas activas para préstamos",
        error: error.message,
      });
    }
  },

  getReservationDetails: async (req, res) => {
    try {
      const { id } = req.params;

      console.log("🔍 Obteniendo detalles de reserva ID:", id);

      // CONSULTA SEGURA - solo campos que existen
      const reservation = await Reservation.findByPk(id, {
        include: [
          {
            model: User,
            attributes: [
              "id",
              "firstName",
              "lastName",
              "email",
              "rol",
              "identificationNumber",
              "city",
            ],
          },
          {
            model: Resource,
            attributes: [
              "id",
              "name",
              "photoUrl",
              "features",
              "isAvailable",
              "isActive",
            ],
            include: [
              {
                model: ResourceType,
                attributes: ["id", "name", "description"],
                include: [
                  {
                    model: Unit,
                    attributes: [
                      "id",
                      "name",
                      "description",
                      "granularity",
                      "isActive",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reserva no encontrada",
        });
      }

      // Obtener información relacionada (opcional)
      const loan = await Loan.findOne({
        where: { reservationId: id },
        include: [
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      const rating = await Rating.findOne({
        where: { reservationId: id },
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });

      let returnRecord = null;
      if (loan) {
        returnRecord = await Return.findOne({
          where: { loanId: loan.id },
          include: [
            {
              model: User,
              as: "Employee",
              attributes: ["id", "firstName", "lastName", "email"],
            },
          ],
        });
      }

      // Preparar respuesta
      const responseData = {
        ...reservation.toJSON(),
        loan: loan
          ? {
              id: loan.id,
              deliveryTime: loan.deliveryTime,
              hasFailure: loan.hasFailure,
              employee: loan.Employee,
            }
          : null,
        rating: rating
          ? {
              id: rating.id,
              stars: rating.stars,
              comment: rating.comment,
              user: rating.User,
            }
          : null,
        return: returnRecord
          ? {
              id: returnRecord.id,
              returnTime: returnRecord.returnTime,
              hasFailure: returnRecord.hasFailure,
              employee: returnRecord.Employee,
            }
          : null,
      };

      // Si es repetitiva, buscar la serie completa
      if (reservation.isRepetitive) {
        const repeatSeries = await Reservation.findAll({
          where: {
            userId: reservation.userId,
            resourceId: reservation.resourceId,
            purpose: reservation.purpose,
            id: { [Op.ne]: id },
          },
          order: [["startDateTime", "ASC"]],
          attributes: [
            "id",
            "startDateTime",
            "endDateTime",
            "status",
            "isRepetitive",
          ],
        });

        responseData.repeatSeries = repeatSeries;
      }

      res.json({
        success: true,
        reservation: responseData,
      });
    } catch (error) {
      console.error("❌ Error en getReservationDetails:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los detalles de la reserva",
        error: error.message,
      });
    }
  },

  updateReservation: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, startDateTime, endDateTime, purpose, attendees } =
        req.body;

      console.log("✏️ Actualizando reserva ID:", id, "con datos:", {
        status,
        purpose,
        attendees,
      });

      const reservation = await Reservation.findByPk(id);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reserva no encontrada",
        });
      }

      const updateData = {};

      // Actualizar estado
      if (status && status !== reservation.status) {
        const validStatuses = [
          "pendiente",
          "activa",
          "finalizada",
          "cancelada",
        ];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Estado inválido. Debe ser uno de: ${validStatuses.join(
              ", "
            )}`,
          });
        }
        updateData.status = status;
      }

      // Actualizar fechas (solo para reservas pendientes)
      if (
        (startDateTime || endDateTime) &&
        reservation.status === "pendiente"
      ) {
        const newStart = startDateTime
          ? new Date(startDateTime)
          : new Date(reservation.startDateTime);
        const newEnd = endDateTime
          ? new Date(endDateTime)
          : new Date(reservation.endDateTime);

        if (newStart >= newEnd) {
          return res.status(400).json({
            success: false,
            message: "La fecha de inicio debe ser anterior a la fecha de fin",
          });
        }

        updateData.startDateTime = newStart;
        updateData.endDateTime = newEnd;
      }

      // Actualizar otros campos
      if (purpose !== undefined) {
        if (purpose.trim().length === 0) {
          return res.status(400).json({
            success: false,
            message: "El propósito no puede estar vacío",
          });
        }
        updateData.purpose = purpose.trim();
      }

      if (attendees !== undefined) {
        if (attendees < 1) {
          return res.status(400).json({
            success: false,
            message: "Debe haber al menos 1 asistente",
          });
        }
        updateData.attendees = attendees;
      }

      // Realizar la actualización
      await reservation.update(updateData);

      res.json({
        success: true,
        message: "Reserva actualizada exitosamente",
        reservation: await Reservation.findByPk(id, {
          include: [
            {
              model: User,
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        }),
      });
    } catch (error) {
      console.error("❌ Error en updateReservation:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar la reserva",
        error: error.message,
      });
    }
  },

  deleteReservation: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      console.log("🗑️ Eliminando reserva ID:", id, "razón:", reason);

      const reservation = await Reservation.findByPk(id, {
        include: [
          {
            model: User,
            attributes: ["id", "email"],
          },
        ],
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reserva no encontrada",
        });
      }

      // Eliminar la reserva
      await reservation.destroy();

      res.json({
        success: true,
        message: "Reserva eliminada exitosamente",
        deletedReservation: {
          id,
          userEmail: reservation.User ? reservation.User.email : null,
          reason: reason || "Sin especificar",
        },
      });
    } catch (error) {
      console.error("❌ Error en deleteReservation:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la reserva",
        error: error.message,
      });
    }
  },

  // ========== GESTIÓN DE RESERVAS REPETITIVAS ==========

  manageRepeatSeries: async (req, res) => {
    try {
      const { seriesId } = req.params;
      const { action } = req.body;

      console.log("🔄 Gestionando serie repetitiva:", { seriesId, action });

      res.json({
        success: true,
        message: "Gestión de series habilitada",
        seriesId,
        action,
      });
    } catch (error) {
      console.error("❌ Error en manageRepeatSeries:", error);
      res.status(500).json({
        success: false,
        message: "Error al gestionar la serie de reservas",
        error: error.message,
      });
    }
  },

  // ========== BÚSQUEDA AVANZADA ==========

  searchReservations: async (req, res) => {
    try {
      const { query } = req.query;

      console.log("🔍 Búsqueda avanzada:", { query });

      let whereConditions = {};

      if (query) {
        whereConditions = {
          [Op.or]: [{ purpose: { [Op.like]: `%${query}%` } }],
        };
      }

      const reservations = await Reservation.findAll({
        where: whereConditions,
        limit: 20,
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
          {
            model: Resource,
            attributes: ["id", "name", "photoUrl"],
          },
        ],
        order: [["startDateTime", "DESC"]],
      });

      res.json({
        success: true,
        count: reservations.length,
        reservations: reservations.map((r) => r.toJSON()),
      });
    } catch (error) {
      console.error("❌ Error en searchReservations:", error);
      res.status(500).json({
        success: false,
        message: "Error en la búsqueda de reservas",
        error: error.message,
      });
    }
  },

  // ========== REPORTES Y ESTADÍSTICAS ==========

  generateReservationsReport: async (req, res) => {
    try {
      console.log("📊 Generando reporte");

      // Estadísticas básicas
      const totalReservations = await Reservation.count();
      const reservations = await Reservation.findAll({
        limit: 100,
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
        ],
      });

      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalReservations,
        },
        reservations: reservations.map((r) => ({
          id: r.id,
          startDateTime: r.startDateTime,
          endDateTime: r.endDateTime,
          status: r.status,
          purpose: r.purpose,
          attendees: r.attendees,
          user: {
            name: `${r.User.firstName} ${r.User.lastName}`,
            email: r.User.email,
            rol: r.User.rol,
          },
        })),
      };

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error("❌ Error en generateReservationsReport:", error);
      res.status(500).json({
        success: false,
        message: "Error al generar el reporte",
        error: error.message,
      });
    }
  },

  // ========== FUNCIONES DE ADMINISTRACIÓN ==========

  bulkUpdateReservations: async (req, res) => {
    try {
      const { reservationIds, updates } = req.body;

      console.log("⚡ Actualización masiva:", {
        count: reservationIds ? reservationIds.length : 0,
        updates,
      });

      if (!reservationIds || !Array.isArray(reservationIds)) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un array de reservationIds",
        });
      }

      // Actualizar cada reserva
      const results = [];
      for (const id of reservationIds) {
        try {
          const reservation = await Reservation.findByPk(id);
          if (reservation) {
            await reservation.update(updates);
            results.push({ id, success: true });
          } else {
            results.push({ id, success: false, error: "No encontrada" });
          }
        } catch (error) {
          results.push({ id, success: false, error: error.message });
        }
      }

      const successful = results.filter((r) => r.success).length;

      res.json({
        success: true,
        message: `Actualizadas ${successful} de ${results.length} reservas`,
        results,
      });
    } catch (error) {
      console.error("❌ Error en bulkUpdateReservations:", error);
      res.status(500).json({
        success: false,
        message: "Error en la actualización masiva",
        error: error.message,
      });
    }
  },
};

module.exports = reservationManagementController;
