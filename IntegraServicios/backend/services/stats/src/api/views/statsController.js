const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const Loan = require("../../../../../models/Loan");
const Rating = require("../../../../../models/Rating");
const Return = require("../../../../../models/Return");
const User = require("../../../../../models/user");
const { Op } = require("sequelize");
const sequelize = require("../../../../../config/database");

const statsController = {
  /**
   * HU-012: Recursos más reservados
   * Consultar los recursos más reservados en un rango de fechas
   */
  getMostReservedResources: async (req, res) => {
    try {
      const { startDate, endDate, resourceTypeId, limit = 10 } = req.query;

      console.log("📊 [HU-012] Consultando recursos más reservados:", {
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

      // Validar rango de fechas
      if (start >= end) {
        return res.status(400).json({
          success: false,
          message:
            "El rango de fechas es inválido. La fecha de inicio debe ser anterior a la fecha de fin",
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

      // Escenario de fallo: No existen reservas en el periodo consultado
      if (resourceIds.length === 0) {
        return res.json({
          success: true,
          message: "No existen reservas en el periodo consultado",
          data: [],
          summary: {
            totalResources: 0,
            totalReservations: 0,
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

        const reservationCount = parseInt(countData.count);

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
            totalReservations: reservationCount,
            reservationCount: reservationCount,
            dateRange: {
              start: start.toISOString(),
              end: end.toISOString(),
            },
          },
        };
      });

      // Criterio: Ordenar por tipo de recurso y luego por nombre
      results.sort((a, b) => {
        const typeComparison = a.resourceType.name.localeCompare(
          b.resourceType.name
        );
        if (typeComparison !== 0) return typeComparison;
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
        message: "Recursos más reservados obtenidos exitosamente",
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
        export: {
          availableFormats: ["json", "csv", "excel"],
          note: "Los datos pueden ser exportados en el formato de su preferencia",
        },
      });
    } catch (error) {
      console.error("❌ Error en getMostReservedResources:", error);
      res.status(500).json({
        success: false,
        message: "El sistema no logra generar el reporte y muestra error",
        error: error.message,
      });
    }
  },

  /**
   * HU-013: Recurso más prestado
   * Consultar el recurso con mayor número de préstamos realizados
   */
  getMostLoanedResource: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      console.log("🏆 [HU-013] Consultando recurso más prestado:", {
        startDate,
        endDate,
      });

      // Construir condiciones WHERE
      const whereConditions = {};

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Validar rango de fechas
        if (start >= end) {
          return res.status(400).json({
            success: false,
            message: "El rango de fechas es inválido",
          });
        }

        whereConditions.startDateTime = {
          [Op.between]: [start, end],
        };
      }

      // Contar préstamos por recurso (solo reservas con préstamo efectivo)
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
        limit: 10, // Obtener top 10 para ordenar por uso
        raw: true,
      });

      // Escenario de fallo: No existen préstamos en el periodo
      if (loanCounts.length === 0) {
        return res.json({
          success: true,
          message: "No existen préstamos registrados en el periodo consultado",
          data: null,
        });
      }

      // Obtener el recurso con más préstamos (el primero ya viene ordenado DESC)
      const topResourceId = loanCounts[0].resourceId;
      const topLoanCount = parseInt(loanCounts[0].count);

      // Obtener TODOS los datos del recurso (criterio de aceptación)
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

      // Obtener estadísticas adicionales del recurso
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

      // Obtener información de fallos de servicio
      const loansWithFailures = await Loan.count({
        include: [
          {
            model: Reservation,
            where: {
              resourceId: topResourceId,
              ...(startDate && endDate ? whereConditions : {}),
            },
            required: true,
          },
        ],
        where: {
          hasFailure: true,
        },
      });

      // Preparar todos los datos del recurso (criterio de aceptación)
      const completeResourceData = {
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
          failuresCount: loansWithFailures,
          failureRate: ((loansWithFailures / topLoanCount) * 100).toFixed(2),
          dateRange:
            startDate && endDate
              ? {
                  start: new Date(startDate).toISOString(),
                  end: new Date(endDate).toISOString(),
                }
              : "all-time",
        },
        ranking: loanCounts.map((item, index) => ({
          position: index + 1,
          resourceId: item.resourceId,
          loanCount: parseInt(item.count),
          isTopResource: item.resourceId === topResourceId,
        })),
      };

      res.json({
        success: true,
        message:
          "Recurso con mayor número de préstamos identificado exitosamente",
        data: completeResourceData,
        export: {
          availableFormats: ["json", "pdf", "excel"],
          note: "El reporte puede ser exportado en el formato de su preferencia",
        },
      });
    } catch (error) {
      console.error("❌ Error en getMostLoanedResource:", error);
      res.status(500).json({
        success: false,
        message: "El sistema no logra generar el reporte",
        error: error.message,
      });
    }
  },

  /**
   * HU-018: Reporte de calificaciones
   * Consultar reportes consolidados de calificaciones de servicios
   */
  getRatingsReport: async (req, res) => {
    try {
      const { startDate, endDate, resourceId, employeeId } = req.query;

      console.log("⭐ [HU-018] Consultando reporte de calificaciones:", {
        startDate,
        endDate,
        resourceId,
        employeeId,
      });

      // Construir condiciones WHERE para reservas
      const reservationWhere = {};

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
          return res.status(400).json({
            success: false,
            message: "El rango de fechas es inválido",
          });
        }

        reservationWhere.startDateTime = {
          [Op.between]: [start, end],
        };
      }

      if (resourceId) {
        reservationWhere.resourceId = resourceId;
      }

      // Condiciones para empleados
      const loanWhere = {};
      if (employeeId) {
        loanWhere.employeeId = employeeId;
      }

      // Obtener todas las calificaciones con sus relaciones
      const ratings = await Rating.findAll({
        include: [
          {
            model: Reservation,
            where: reservationWhere,
            required: true,
            include: [
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
              {
                model: User,
                attributes: ["id", "firstName", "lastName", "email"],
              },
              {
                model: Loan,
                where: loanWhere,
                required: employeeId ? true : false,
                include: [
                  {
                    model: User,
                    as: "Employee",
                    attributes: ["id", "firstName", "lastName", "email"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      // Escenario de fallo: No existen calificaciones
      if (ratings.length === 0) {
        return res.json({
          success: true,
          message: "No existen calificaciones en el rango consultado",
          data: {
            byResource: [],
            byEmployee: [],
            overall: null,
            details: [],
          },
        });
      }

      // ===== PROMEDIOS POR RECURSO =====
      const resourceRatings = {};
      ratings.forEach((rating) => {
        const resourceId = rating.Reservation.Resource.id;
        if (!resourceRatings[resourceId]) {
          resourceRatings[resourceId] = {
            resource: {
              id: rating.Reservation.Resource.id,
              name: rating.Reservation.Resource.name,
              photoUrl: rating.Reservation.Resource.photoUrl,
              type: rating.Reservation.Resource.ResourceType.name,
            },
            ratings: [],
            scheduleCompliance: [],
            resourceQuality: [],
            staffKindness: [],
            averageStars: [],
          };
        }
        resourceRatings[resourceId].ratings.push(rating);
        resourceRatings[resourceId].scheduleCompliance.push(
          rating.scheduleCompliance
        );
        resourceRatings[resourceId].resourceQuality.push(
          rating.resourceQuality
        );
        resourceRatings[resourceId].staffKindness.push(rating.staffKindness);
        resourceRatings[resourceId].averageStars.push(
          parseFloat(rating.averageStars)
        );
      });

      const byResource = Object.values(resourceRatings).map((item) => ({
        resource: item.resource,
        statistics: {
          totalRatings: item.ratings.length,
          averages: {
            overall: (
              item.averageStars.reduce((a, b) => a + b, 0) /
              item.averageStars.length
            ).toFixed(2),
            scheduleCompliance: (
              item.scheduleCompliance.reduce((a, b) => a + b, 0) /
              item.scheduleCompliance.length
            ).toFixed(2),
            resourceQuality: (
              item.resourceQuality.reduce((a, b) => a + b, 0) /
              item.resourceQuality.length
            ).toFixed(2),
            staffKindness: (
              item.staffKindness.reduce((a, b) => a + b, 0) /
              item.staffKindness.length
            ).toFixed(2),
          },
        },
      }));

      // Ordenar por calificación promedio (mejor a peor)
      byResource.sort(
        (a, b) => b.statistics.averages.overall - a.statistics.averages.overall
      );

      // ===== PROMEDIOS POR EMPLEADO =====
      const employeeRatings = {};
      ratings.forEach((rating) => {
        if (rating.Reservation.Loan && rating.Reservation.Loan.Employee) {
          const empId = rating.Reservation.Loan.Employee.id;
          if (!employeeRatings[empId]) {
            employeeRatings[empId] = {
              employee: {
                id: rating.Reservation.Loan.Employee.id,
                name: `${rating.Reservation.Loan.Employee.firstName} ${rating.Reservation.Loan.Employee.lastName}`,
                email: rating.Reservation.Loan.Employee.email,
              },
              ratings: [],
              staffKindness: [],
              scheduleCompliance: [],
            };
          }
          employeeRatings[empId].ratings.push(rating);
          employeeRatings[empId].staffKindness.push(rating.staffKindness);
          employeeRatings[empId].scheduleCompliance.push(
            rating.scheduleCompliance
          );
        }
      });

      const byEmployee = Object.values(employeeRatings).map((item) => ({
        employee: item.employee,
        statistics: {
          totalRatings: item.ratings.length,
          averages: {
            staffKindness: (
              item.staffKindness.reduce((a, b) => a + b, 0) /
              item.staffKindness.length
            ).toFixed(2),
            scheduleCompliance: (
              item.scheduleCompliance.reduce((a, b) => a + b, 0) /
              item.scheduleCompliance.length
            ).toFixed(2),
          },
        },
      }));

      // Ordenar por amabilidad (mejor a peor)
      byEmployee.sort(
        (a, b) =>
          b.statistics.averages.staffKindness -
          a.statistics.averages.staffKindness
      );

      // ===== ESTADÍSTICAS GENERALES =====
      const allScheduleCompliance = ratings.map((r) => r.scheduleCompliance);
      const allResourceQuality = ratings.map((r) => r.resourceQuality);
      const allStaffKindness = ratings.map((r) => r.staffKindness);
      const allAverageStars = ratings.map((r) => parseFloat(r.averageStars));

      const overall = {
        totalRatings: ratings.length,
        averages: {
          overall: (
            allAverageStars.reduce((a, b) => a + b, 0) / allAverageStars.length
          ).toFixed(2),
          scheduleCompliance: (
            allScheduleCompliance.reduce((a, b) => a + b, 0) /
            allScheduleCompliance.length
          ).toFixed(2),
          resourceQuality: (
            allResourceQuality.reduce((a, b) => a + b, 0) /
            allResourceQuality.length
          ).toFixed(2),
          staffKindness: (
            allStaffKindness.reduce((a, b) => a + b, 0) /
            allStaffKindness.length
          ).toFixed(2),
        },
        distribution: {
          5: ratings.filter((r) => parseFloat(r.averageStars) >= 4.5).length,
          4: ratings.filter(
            (r) =>
              parseFloat(r.averageStars) >= 3.5 &&
              parseFloat(r.averageStars) < 4.5
          ).length,
          3: ratings.filter(
            (r) =>
              parseFloat(r.averageStars) >= 2.5 &&
              parseFloat(r.averageStars) < 3.5
          ).length,
          2: ratings.filter(
            (r) =>
              parseFloat(r.averageStars) >= 1.5 &&
              parseFloat(r.averageStars) < 2.5
          ).length,
          1: ratings.filter((r) => parseFloat(r.averageStars) < 1.5).length,
        },
      };

      // ===== DETALLES INDIVIDUALES (para tabla) =====
      const details = ratings.slice(0, 50).map((rating) => ({
        id: rating.id,
        date: rating.createdAt,
        resource: {
          id: rating.Reservation.Resource.id,
          name: rating.Reservation.Resource.name,
          type: rating.Reservation.Resource.ResourceType.name,
        },
        user: {
          id: rating.Reservation.User.id,
          name: `${rating.Reservation.User.firstName} ${rating.Reservation.User.lastName}`,
        },
        employee: rating.Reservation.Loan
          ? {
              id: rating.Reservation.Loan.Employee.id,
              name: `${rating.Reservation.Loan.Employee.firstName} ${rating.Reservation.Loan.Employee.lastName}`,
            }
          : null,
        ratings: {
          scheduleCompliance: rating.scheduleCompliance,
          resourceQuality: rating.resourceQuality,
          staffKindness: rating.staffKindness,
          average: parseFloat(rating.averageStars),
        },
        comment: rating.comment,
      }));

      res.json({
        success: true,
        message: "Reporte de calificaciones generado exitosamente",
        data: {
          byResource, // Para gráficos y análisis por recurso
          byEmployee, // Para gráficos y análisis por empleado
          overall, // Estadísticas generales
          details, // Para tabla detallada
        },
        filters: {
          dateRange:
            startDate && endDate
              ? {
                  start: new Date(startDate).toISOString(),
                  end: new Date(endDate).toISOString(),
                }
              : "all-time",
          resourceId: resourceId || "all",
          employeeId: employeeId || "all",
        },
        export: {
          availableFormats: ["json", "pdf", "excel", "csv"],
          graphsAvailable: true,
          note: "Los datos están listos para visualización gráfica y tabular",
        },
      });
    } catch (error) {
      console.error("❌ Error en getRatingsReport:", error);
      res.status(500).json({
        success: false,
        message: "El sistema no puede generar gráficos o reporte",
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

module.exports = statsController;
