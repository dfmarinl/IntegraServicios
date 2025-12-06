const Loan = require("../../../../../models/Loan");
const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const User = require("../../../../../models/user");
const { Op } = require("sequelize");

const loanController = {
  // ========== CREAR PRÉSTAMO (registrar entrega) ==========

  createLoan: async (req, res) => {
    try {
      const { reservationId, deliveryTime } = req.body;
      const employeeId = req.user.id; // El empleado que hace el registro

      // Validaciones
      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: "El ID de la reserva es requerido",
        });
      }

      if (!deliveryTime) {
        return res.status(400).json({
          success: false,
          message: "La hora de entrega es requerida",
        });
      }

      // Verificar que la reserva existe y está activa
      const reservation = await Reservation.findOne({
        where: {
          id: reservationId,
          status: "activa",
        },
        include: [
          {
            model: Resource,
            attributes: ["id", "name"],
          },
        ],
      });

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reserva no encontrada o no está activa",
        });
      }

      // Verificar que no tenga préstamo registrado ya
      const existingLoan = await Loan.findOne({
        where: { reservationId },
      });

      if (existingLoan) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un préstamo registrado para esta reserva",
        });
      }

      // Calcular si hay fallo de servicio (±5 minutos)
      const reservationStart = new Date(reservation.startDateTime);
      const actualDelivery = new Date(deliveryTime);
      const timeDiff =
        Math.abs(actualDelivery - reservationStart) / (1000 * 60); // minutos
      const hasFailure = timeDiff > 5;

      // Crear el préstamo
      const loan = await Loan.create({
        reservationId,
        deliveryTime: actualDelivery,
        employeeId,
        hasFailure,
      });

      // Obtener detalles completos para respuesta
      const loanWithDetails = await Loan.findByPk(loan.id, {
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
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: hasFailure
          ? "Préstamo registrado con fallo de servicio (fuera de lapso)"
          : "Préstamo registrado exitosamente",
        loan: loanWithDetails,
        serviceInfo: {
          reservationStart: reservationStart,
          actualDelivery: actualDelivery,
          timeDifference: Math.round(timeDiff) + " minutos",
          hasFailure: hasFailure,
          withinWindow: !hasFailure,
        },
      });
    } catch (err) {
      console.error("❌ Error al crear préstamo:", err);

      if (err.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Reserva o empleado no válido",
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
        message: "Error al registrar el préstamo",
        error: err.message,
      });
    }
  },

  // ========== OBTENER TODOS LOS PRÉSTAMOS ==========

  getLoans: async (req, res) => {
    try {
      const loans = await Loan.findAll({
        order: [["deliveryTime", "DESC"]],
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "purpose", "attendees"],
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
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      res.json({
        success: true,
        loans,
        total: loans.length,
      });
    } catch (err) {
      console.error("❌ Error al obtener préstamos:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener préstamos",
        error: err.message,
      });
    }
  },

  // ========== OBTENER PRÉSTAMOS PAGINADOS ==========

  getLoansPaginated: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        hasFailure,
        startDate,
        endDate,
        reservationId,
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Filtros
      if (hasFailure !== undefined) {
        whereConditions.hasFailure = hasFailure === "true";
      }

      if (reservationId) {
        whereConditions.reservationId = reservationId;
      }

      // Filtro por fecha de entrega
      if (startDate && endDate) {
        whereConditions.deliveryTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const { count, rows: loans } = await Loan.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Reservation,
            attributes: ["id", "startDateTime", "purpose", "attendees"],
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
                include: [
                  {
                    model: ResourceType,
                    attributes: ["id", "name"],
                    include: [
                      {
                        model: Unit,
                        attributes: ["id", "name"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["deliveryTime", "DESC"]],
        offset: parseInt(offset),
        limit: parseInt(limit),
        distinct: true,
      });

      res.json({
        success: true,
        loans,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (err) {
      console.error("❌ Error al paginar préstamos:", err);
      res.status(500).json({
        success: false,
        message: "Error al paginar préstamos",
        error: err.message,
      });
    }
  },

  // ========== OBTENER UN PRÉSTAMO ESPECÍFICO ==========

  getLoan: async (req, res) => {
    try {
      const { id } = req.params;

      const loan = await Loan.findByPk(id, {
        include: [
          {
            model: Reservation,
            attributes: [
              "id",
              "startDateTime",
              "endDateTime",
              "purpose",
              "attendees",
              "status",
            ],
            include: [
              {
                model: Resource,
                attributes: ["id", "name", "photoUrl", "features"],
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
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
        ],
      });

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: "Préstamo no encontrado",
        });
      }

      // Calcular estadísticas del préstamo
      const reservationStart = new Date(loan.Reservation.startDateTime);
      const deliveryTime = new Date(loan.deliveryTime);
      const timeDiff = Math.abs(deliveryTime - reservationStart) / (1000 * 60);

      res.json({
        success: true,
        loan,
        statistics: {
          timeDifference: Math.round(timeDiff) + " minutos",
          hasFailure: loan.hasFailure,
          withinWindow: timeDiff <= 5,
          reservationStart: reservationStart,
          actualDelivery: deliveryTime,
        },
      });
    } catch (err) {
      console.error("❌ Error al obtener préstamo:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener préstamo",
        error: err.message,
      });
    }
  },

  // ========== ACTUALIZAR UN PRÉSTAMO ==========

  updateLoan: async (req, res) => {
    try {
      const { id } = req.params;
      const { deliveryTime, hasFailure } = req.body;

      const loan = await Loan.findByPk(id);

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: "Préstamo no encontrado",
        });
      }

      const updateData = {};

      // Actualizar hora de entrega si se proporciona
      if (deliveryTime) {
        // Verificar la reserva para recalcular fallo de servicio
        const reservation = await Reservation.findByPk(loan.reservationId);
        if (reservation) {
          const reservationStart = new Date(reservation.startDateTime);
          const newDeliveryTime = new Date(deliveryTime);
          const timeDiff =
            Math.abs(newDeliveryTime - reservationStart) / (1000 * 60);

          updateData.deliveryTime = newDeliveryTime;
          updateData.hasFailure = timeDiff > 5;
        } else {
          updateData.deliveryTime = new Date(deliveryTime);
        }
      }

      // Actualizar fallo de servicio si se proporciona explícitamente
      if (hasFailure !== undefined) {
        updateData.hasFailure = hasFailure;
      }

      // Realizar la actualización
      await loan.update(updateData);

      res.json({
        success: true,
        message: "Préstamo actualizado exitosamente",
        loan: await Loan.findByPk(id, {
          include: [
            {
              model: User,
              as: "Employee",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        }),
      });
    } catch (err) {
      console.error("❌ Error al actualizar préstamo:", err);

      if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: err.errors.map((e) => e.message).join(", "),
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar préstamo",
        error: err.message,
      });
    }
  },

  // ========== ELIMINAR UN PRÉSTAMO ==========

  deleteLoan: async (req, res) => {
    try {
      const { id } = req.params;

      const loan = await Loan.findByPk(id, {
        include: [
          {
            model: Reservation,
            attributes: ["id"],
          },
        ],
      });

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: "Préstamo no encontrado",
        });
      }

      // Verificar si el préstamo está asociado a otros registros (como devoluciones)
      // Esto depende de si tienes un modelo Return
      // const returnRecord = await Return.findOne({ where: { loanId: id } });
      // if (returnRecord) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "No se puede eliminar un préstamo con devolución registrada"
      //   });
      // }

      // Eliminar el préstamo
      await loan.destroy();

      res.json({
        success: true,
        message: "Préstamo eliminado exitosamente",
        deletedLoan: {
          id,
          reservationId: loan.reservationId,
          deliveryTime: loan.deliveryTime,
        },
      });
    } catch (err) {
      console.error("❌ Error al eliminar préstamo:", err);
      res.status(500).json({
        success: false,
        message: "Error al eliminar préstamo",
        error: err.message,
      });
    }
  },

  // ========== ESTADÍSTICAS DE PRÉSTAMOS ==========

  getLoanStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const whereConditions = {};

      if (startDate && endDate) {
        whereConditions.deliveryTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Conteo total
      const totalLoans = await Loan.count({ where: whereConditions });

      // Préstamos con fallo de servicio
      const loansWithFailure = await Loan.count({
        where: {
          ...whereConditions,
          hasFailure: true,
        },
      });

      // Préstamos sin fallo
      const loansWithoutFailure = totalLoans - loansWithFailure;

      // Préstamos por empleado
      const loansByEmployee = await Loan.findAll({
        where: whereConditions,
        attributes: [
          "employeeId",
          [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        ],
        group: ["employeeId"],
        include: [
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });

      // Préstamos por unidad (a través del recurso)
      const loansByUnit = await Loan.findAll({
        where: whereConditions,
        attributes: [
          [
            sequelize.literal(
              '"Reservation->Resource->ResourceType->Unit"."id"'
            ),
            "unitId",
          ],
          [
            sequelize.literal(
              '"Reservation->Resource->ResourceType->Unit"."name"'
            ),
            "unitName",
          ],
          [sequelize.fn("COUNT", sequelize.col("Loan.id")), "count"],
        ],
        include: [
          {
            model: Reservation,
            attributes: [],
            include: [
              {
                model: Resource,
                attributes: [],
                include: [
                  {
                    model: ResourceType,
                    attributes: [],
                    include: [
                      {
                        model: Unit,
                        attributes: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        group: ["Reservation->Resource->ResourceType->Unit.id"],
        raw: true,
      });

      res.json({
        success: true,
        stats: {
          total: totalLoans,
          withFailure: loansWithFailure,
          withoutFailure: loansWithoutFailure,
          failureRate:
            totalLoans > 0
              ? ((loansWithFailure / totalLoans) * 100).toFixed(2) + "%"
              : "0%",
          byEmployee: loansByEmployee.map((item) => ({
            employeeId: item.employeeId,
            employeeName: item.Employee
              ? `${item.Employee.firstName} ${item.Employee.lastName}`
              : "Desconocido",
            count: parseInt(item.dataValues.count),
          })),
          byUnit: loansByUnit
            .filter((item) => item.unitId)
            .map((item) => ({
              unitId: item.unitId,
              unitName: item.unitName,
              count: parseInt(item.count),
            })),
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
      console.error("❌ Error al obtener estadísticas de préstamos:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: err.message,
      });
    }
  },

  // ========== OBTENER PRÉSTAMOS POR RESERVA ==========

  getLoansByReservation: async (req, res) => {
    try {
      const { reservationId } = req.params;

      const loans = await Loan.findAll({
        where: { reservationId },
        include: [
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["deliveryTime", "DESC"]],
      });

      res.json({
        success: true,
        loans,
        reservationId,
        count: loans.length,
      });
    } catch (err) {
      console.error("❌ Error al obtener préstamos por reserva:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener préstamos",
        error: err.message,
      });
    }
  },

  // ========== OBTENER PRÉSTAMOS POR EMPLEADO ==========

  getLoansByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      const whereConditions = { employeeId };

      if (startDate && endDate) {
        whereConditions.deliveryTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const loans = await Loan.findAll({
        where: whereConditions,
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
        ],
        order: [["deliveryTime", "DESC"]],
      });

      // Obtener información del empleado
      const employee = await User.findByPk(employeeId, {
        attributes: ["id", "firstName", "lastName", "email", "rol"],
      });

      res.json({
        success: true,
        employee: employee || {
          id: employeeId,
          name: "Empleado no encontrado",
        },
        loans,
        total: loans.length,
        withFailure: loans.filter((loan) => loan.hasFailure).length,
        withoutFailure: loans.filter((loan) => !loan.hasFailure).length,
      });
    } catch (err) {
      console.error("❌ Error al obtener préstamos por empleado:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener préstamos del empleado",
        error: err.message,
      });
    }
  },
};

module.exports = loanController;
