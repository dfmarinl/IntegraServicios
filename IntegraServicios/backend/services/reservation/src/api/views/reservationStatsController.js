const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const Loan = require("../../../../../models/Loan");
const { Op } = require("sequelize");
const sequelize = require("../../../../../config/database");

const reservationsStatsController = {
  /**
   * HU-012: Obtener los recursos más reservados por tipo
   * RF6: Consultar el (los) recurso(s) más reservado(s) en el sistema para un tipo de recurso,
   * dado un rango de fechas.
   */
  getMostReservedResourcesByType: async (req, res) => {
    try {
      const { startDate, endDate, resourceTypeId, limit = 10 } = req.query;

      console.log("📊 Consultando recursos más reservados:", {
        startDate,
        endDate,
        resourceTypeId,
        limit,
      });

      // Validación de parámetros
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Se requieren los parámetros startDate y endDate",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return res.status(400).json({
          success: false,
          message: "La fecha de inicio debe ser anterior a la fecha de fin",
        });
      }

      // Construir condiciones WHERE para las reservas
      const reservationWhere = {
        startDateTime: {
          [Op.between]: [start, end],
        },
        status: {
          [Op.in]: ["pendiente", "activa", "finalizada"], // Excluir canceladas
        },
      };

      // Construir condiciones WHERE para los recursos
      const resourceWhere = {};
      if (resourceTypeId) {
        resourceWhere.resourceTypeId = resourceTypeId;
      }

      // Consulta principal: contar reservas por recurso
      const reservationCounts = await Reservation.findAll({
        attributes: [
          "resourceId",
          [sequelize.fn("COUNT", sequelize.col("Reservation.id")), "count"],
        ],
        where: reservationWhere,
        include: [
          {
            model: Resource,
            attributes: [],
            where: resourceWhere,
            required: true,
          },
        ],
        group: ["resourceId"],
        order: [[sequelize.literal("count"), "DESC"]],
        limit: parseInt(limit),
        raw: true,
      });

      // Obtener IDs de los recursos más reservados
      const resourceIds = reservationCounts.map((item) => item.resourceId);

      if (resourceIds.length === 0) {
        return res.json({
          success: true,
          message:
            "No se encontraron reservas en el rango de fechas especificado",
          data: [],
          summary: {
            totalResources: 0,
            dateRange: {
              start: start.toISOString(),
              end: end.toISOString(),
            },
            resourceTypeFilter: resourceTypeId || "all",
          },
        });
      }

      // Obtener detalles completos de los recursos
      const resourcesWithDetails = await Resource.findAll({
        where: {
          id: {
            [Op.in]: resourceIds,
          },
        },
        include: [
          {
            model: ResourceType,
            attributes: ["id", "name", "description", "granularity"],
            include: [
              {
                model: Unit,
                attributes: ["id", "name", "description"],
                required: false,
              },
            ],
          },
        ],
        order: [["name", "ASC"]],
      });

      // Combinar datos: recursos con su cantidad de reservas
      const results = resourcesWithDetails.map((resource) => {
        const countData = reservationCounts.find(
          (rc) => rc.resourceId === resource.id
        );

        return {
          resource: {
            id: resource.id,
            name: resource.name,
            photoUrl: resource.photoUrl,
            features: resource.features,
            isAvailable: resource.isAvailable,
            isActive: resource.isActive,
          },
          resourceType: {
            id: resource.ResourceType.id,
            name: resource.ResourceType.name,
            description: resource.ResourceType.description,
            granularity: resource.ResourceType.granularity,
          },
          unit: resource.ResourceType.Unit
            ? {
                id: resource.ResourceType.Unit.id,
                name: resource.ResourceType.Unit.name,
                description: resource.ResourceType.Unit.description,
              }
            : null,
          statistics: {
            reservationCount: parseInt(countData.count),
            dateRange: {
              start: start.toISOString(),
              end: end.toISOString(),
            },
          },
        };
      });

      // Ordenar por tipo de recurso y luego por nombre (criterio de aceptación)
      results.sort((a, b) => {
        // Primero por tipo de recurso
        const typeComparison = a.resourceType.name.localeCompare(
          b.resourceType.name
        );
        if (typeComparison !== 0) return typeComparison;

        // Luego por nombre del recurso
        return a.resource.name.localeCompare(b.resource.name);
      });

      // Calcular estadísticas de resumen
      const totalReservations = results.reduce(
        (sum, item) => sum + item.statistics.reservationCount,
        0
      );

      const resourcesByType = results.reduce((acc, item) => {
        const typeName = item.resourceType.name;
        if (!acc[typeName]) {
          acc[typeName] = {
            count: 0,
            totalReservations: 0,
          };
        }
        acc[typeName].count++;
        acc[typeName].totalReservations += item.statistics.reservationCount;
        return acc;
      }, {});

      res.json({
        success: true,
        data: results,
        summary: {
          totalResources: results.length,
          totalReservations,
          dateRange: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          resourceTypeFilter: resourceTypeId || "all",
          resourcesByType,
        },
      });
    } catch (error) {
      console.error("❌ Error en getMostReservedResourcesByType:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas de recursos más reservados",
        error: error.message,
      });
    }
  },

  /**
   * RF7: Obtener todos los datos del recurso que está presente en el mayor número de préstamos realizados
   * Nota: Un préstamo es una reserva que ha sido efectivamente entregada (tiene un Loan asociado)
   */
  getResourceWithMostLoans: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      console.log("🏆 Consultando recurso con más préstamos:", {
        startDate,
        endDate,
      });

      // Construir condiciones WHERE
      const whereConditions = {};

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
          return res.status(400).json({
            success: false,
            message: "La fecha de inicio debe ser anterior a la fecha de fin",
          });
        }

        whereConditions.startDateTime = {
          [Op.between]: [start, end],
        };
      }

      // Solo contar reservas que tienen préstamo asociado
      const loanCounts = await Reservation.findAll({
        attributes: [
          "resourceId",
          [sequelize.fn("COUNT", sequelize.col("Reservation.id")), "count"],
        ],
        where: whereConditions,
        include: [
          {
            model: Loan,
            attributes: [],
            required: true, // INNER JOIN - solo reservas con préstamo
          },
          {
            model: Resource,
            attributes: [],
            required: true,
          },
        ],
        group: ["resourceId"],
        order: [[sequelize.literal("count"), "DESC"]],
        limit: 1,
        raw: true,
      });

      if (loanCounts.length === 0) {
        return res.json({
          success: true,
          message: "No se encontraron préstamos en el rango especificado",
          data: null,
        });
      }

      const topResourceId = loanCounts[0].resourceId;
      const topLoanCount = parseInt(loanCounts[0].count);

      // Obtener todos los detalles del recurso
      const resource = await Resource.findByPk(topResourceId, {
        include: [
          {
            model: ResourceType,
            attributes: ["id", "name", "description", "granularity"],
            include: [
              {
                model: Unit,
                attributes: ["id", "name", "description"],
                required: false,
              },
            ],
          },
        ],
      });

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "No se encontró el recurso",
        });
      }

      // Obtener estadísticas adicionales de este recurso
      const additionalStats = await Reservation.findAll({
        attributes: [
          [sequelize.fn("COUNT", sequelize.col("Reservation.id")), "total"],
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("userId"))
            ),
            "users",
          ],
        ],
        where: {
          resourceId: topResourceId,
          ...(startDate && endDate ? whereConditions : {}),
        },
        raw: true,
      });

      const stats = additionalStats[0];

      res.json({
        success: true,
        data: {
          resource: {
            id: resource.id,
            name: resource.name,
            photoUrl: resource.photoUrl,
            features: resource.features,
            isAvailable: resource.isAvailable,
            isActive: resource.isActive,
            createdAt: resource.createdAt,
            updatedAt: resource.updatedAt,
          },
          resourceType: {
            id: resource.ResourceType.id,
            name: resource.ResourceType.name,
            description: resource.ResourceType.description,
            granularity: resource.ResourceType.granularity,
          },
          unit: resource.ResourceType.Unit
            ? {
                id: resource.ResourceType.Unit.id,
                name: resource.ResourceType.Unit.name,
                description: resource.ResourceType.Unit.description,
              }
            : null,
          statistics: {
            loanCount: topLoanCount,
            totalReservations: parseInt(stats.total),
            uniqueUsers: parseInt(stats.users),
            loanRate: ((topLoanCount / parseInt(stats.total)) * 100).toFixed(2),
            dateRange:
              startDate && endDate
                ? {
                    start: new Date(startDate).toISOString(),
                    end: new Date(endDate).toISOString(),
                  }
                : "all-time",
          },
        },
      });
    } catch (error) {
      console.error("❌ Error en getResourceWithMostLoans:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener recurso con más préstamos",
        error: error.message,
      });
    }
  },

  /**
   * Endpoint adicional: Estadísticas generales de reservas
   */
  getReservationsStatsSummary: async (req, res) => {
    try {
      const { startDate, endDate, resourceTypeId } = req.query;

      console.log("📈 Consultando resumen de estadísticas:", {
        startDate,
        endDate,
        resourceTypeId,
      });

      const whereConditions = {};

      if (startDate && endDate) {
        whereConditions.startDateTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const resourceWhere = {};
      if (resourceTypeId) {
        resourceWhere.resourceTypeId = resourceTypeId;
      }

      // Estadísticas de reservas por estado
      const reservationsByStatus = await Reservation.findAll({
        attributes: [
          "status",
          [sequelize.fn("COUNT", sequelize.col("Reservation.id")), "count"],
        ],
        where: whereConditions,
        include: [
          {
            model: Resource,
            attributes: [],
            where: resourceWhere,
            required: true,
          },
        ],
        group: ["status"],
        raw: true,
      });

      // Estadísticas por tipo de recurso
      const reservationsByType = await Reservation.findAll({
        attributes: [
          [sequelize.col("Resource.ResourceType.id"), "typeId"],
          [sequelize.col("Resource.ResourceType.name"), "typeName"],
          [sequelize.fn("COUNT", sequelize.col("Reservation.id")), "count"],
        ],
        where: whereConditions,
        include: [
          {
            model: Resource,
            attributes: [],
            where: resourceWhere,
            required: true,
            include: [
              {
                model: ResourceType,
                attributes: [],
                required: true,
              },
            ],
          },
        ],
        group: ["Resource.ResourceType.id", "Resource.ResourceType.name"],
        order: [[sequelize.literal("count"), "DESC"]],
        raw: true,
      });

      // Total de usuarios únicos
      const uniqueUsers = await Reservation.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("userId"))
            ),
            "count",
          ],
        ],
        where: whereConditions,
        include: [
          {
            model: Resource,
            attributes: [],
            where: resourceWhere,
            required: true,
          },
        ],
        raw: true,
      });

      // Total de recursos únicos reservados
      const uniqueResources = await Reservation.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("resourceId"))
            ),
            "count",
          ],
        ],
        where: whereConditions,
        include: [
          {
            model: Resource,
            attributes: [],
            where: resourceWhere,
            required: true,
          },
        ],
        raw: true,
      });

      res.json({
        success: true,
        summary: {
          byStatus: reservationsByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {}),
          byResourceType: reservationsByType.map((item) => ({
            typeId: item.typeId,
            typeName: item.typeName,
            count: parseInt(item.count),
          })),
          uniqueUsers: parseInt(uniqueUsers[0].count),
          uniqueResources: parseInt(uniqueResources[0].count),
          filters: {
            dateRange:
              startDate && endDate
                ? {
                    start: new Date(startDate).toISOString(),
                    end: new Date(endDate).toISOString(),
                  }
                : "all-time",
            resourceTypeId: resourceTypeId || "all",
          },
        },
      });
    } catch (error) {
      console.error("❌ Error en getReservationsStatsSummary:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener resumen de estadísticas",
        error: error.message,
      });
    }
  },
};

module.exports = reservationsStatsController;
