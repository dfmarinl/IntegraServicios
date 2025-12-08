const Return = require("../../../../../models/Return");
const Loan = require("../../../../../models/Loan");
const Reservation = require("../../../../../models/Reservation");
const Resource = require("../../../../../models/Resource");
const ResourceType = require("../../../../../models/ResourceType");
const Unit = require("../../../../../models/Unit");
const User = require("../../../../../models/user");
const { Op, fn, col, literal } = require("sequelize");

const returnController = {
  // ========== CREAR DEVOLUCIÓN (registrar recepción) ==========

  createReturn: async (req, res) => {
    try {
      const { loanId, returnTime, hasDamage } = req.body;
      const employeeId = req.user.id; // El empleado que recibe el recurso

      // Validaciones
      if (!loanId) {
        return res.status(400).json({
          success: false,
          message: "El ID del préstamo es requerido",
        });
      }

      if (!returnTime) {
        return res.status(400).json({
          success: false,
          message: "La hora de devolución es requerida",
        });
      }

      // Verificar que el préstamo existe
      const loan = await Loan.findOne({
        where: { id: loanId },
        include: [
          {
            model: Reservation,
            attributes: ["id", "endDateTime", "status"],
            include: [
              {
                model: Resource,
                attributes: ["id", "name"],
              },
            ],
          },
        ],
      });

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: "Préstamo no encontrado",
        });
      }

      // Verificar que la reserva existe
      if (!loan.Reservation) {
        return res.status(400).json({
          success: false,
          message: "No se encontró la reserva asociada al préstamo",
        });
      }

      // Verificar que no tenga devolución registrada ya
      const existingReturn = await Return.findOne({
        where: { loanId },
      });

      if (existingReturn) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una devolución registrada para este préstamo",
          returnRecord: existingReturn,
        });
      }

      // Calcular si hay fallo de servicio
      // REGLA: Solo es fallo si se devuelve MÁS DE 5 minutos DESPUÉS del fin
      const reservationEnd = new Date(loan.Reservation.endDateTime);
      const actualReturn = new Date(returnTime);
      const timeDiff = (actualReturn - reservationEnd) / (1000 * 60); // minutos (positivo si es después, negativo si es antes)

      // Solo marca fallo si la devolución es DESPUÉS y fuera de la ventana
      const hasFailure = timeDiff > 5;
      const isEarly = actualReturn < reservationEnd;
      const isOnTime = timeDiff >= 0 && timeDiff <= 5;

      // Crear la devolución
      const returnRecord = await Return.create({
        loanId,
        returnTime: actualReturn,
        employeeId,
        hasFailure,
        hasDamage: hasDamage || false,
      });

      // ✅ ACTUALIZAR EL ESTADO DE LA RESERVA A "finalizada"
      await Reservation.update(
        { status: "finalizada" },
        { where: { id: loan.Reservation.id } }
      );

      // Obtener detalles completos para respuesta
      const returnWithDetails = await Return.findByPk(returnRecord.id, {
        include: [
          {
            model: Loan,
            attributes: ["id", "deliveryTime", "hasFailure"],
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
          },
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
      });

      // Mensaje apropiado según el tipo de devolución
      let message = "";
      if (isEarly) {
        message = "Devolución anticipada registrada exitosamente";
      } else if (isOnTime) {
        message = "Devolución registrada exitosamente (dentro de ventana)";
      } else if (hasFailure) {
        message =
          "Devolución registrada con fallo de servicio (devolución tardía)";
      }

      res.status(201).json({
        success: true,
        message: message,
        returnRecord: returnWithDetails,
        timeInfo: {
          reservationEnd: reservationEnd,
          actualReturn: actualReturn,
          timeDifference:
            Math.abs(Math.round(timeDiff)) +
            " minutos " +
            (timeDiff < 0 ? "antes" : "después"),
          hasFailure: hasFailure,
          isEarly: isEarly,
          isOnTime: isOnTime,
          withinWindow: !hasFailure,
        },
        reservationStatus: "finalizada", // Estado actualizado
      });
    } catch (err) {
      console.error("❌ Error al crear devolución:", err);

      if (err.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
          success: false,
          message: "Préstamo o empleado no válido",
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
        message: "Error al registrar la devolución",
        error: err.message,
      });
    }
  },

  // ========== OBTENER TODAS LAS DEVOLUCIONES ==========

  getReturns: async (req, res) => {
    try {
      const returns = await Return.findAll({
        order: [["returnTime", "DESC"]],
        include: [
          {
            model: Loan,
            attributes: ["id", "deliveryTime", "hasFailure"],
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
        returns,
        total: returns.length,
      });
    } catch (err) {
      console.error("❌ Error al obtener devoluciones:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener devoluciones",
        error: err.message,
      });
    }
  },

  // ========== OBTENER DEVOLUCIONES PAGINADAS ==========

  getReturnsPaginated: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        hasFailure,
        startDate,
        endDate,
        loanId,
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};

      // Filtros
      if (hasFailure !== undefined) {
        whereConditions.hasFailure = hasFailure === "true";
      }

      if (loanId) {
        whereConditions.loanId = loanId;
      }

      // Filtro por fecha de devolución
      if (startDate && endDate) {
        whereConditions.returnTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const { count, rows: returns } = await Return.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Loan,
            attributes: ["id", "deliveryTime", "hasFailure"],
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
          },
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["returnTime", "DESC"]],
        offset: parseInt(offset),
        limit: parseInt(limit),
        distinct: true,
      });

      res.json({
        success: true,
        returns,
        pagination: {
          total: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (err) {
      console.error("❌ Error al paginar devoluciones:", err);
      res.status(500).json({
        success: false,
        message: "Error al paginar devoluciones",
        error: err.message,
      });
    }
  },

  // ========== OBTENER UNA DEVOLUCIÓN ESPECÍFICA ==========

  getReturn: async (req, res) => {
    try {
      const { id } = req.params;

      const returnRecord = await Return.findByPk(id, {
        include: [
          {
            model: Loan,
            attributes: ["id", "deliveryTime", "hasFailure"],
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
          },
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email", "rol"],
          },
        ],
      });

      if (!returnRecord) {
        return res.status(404).json({
          success: false,
          message: "Devolución no encontrada",
        });
      }

      // Calcular estadísticas de la devolución
      const reservationEnd = new Date(
        returnRecord.Loan.Reservation.endDateTime
      );
      const returnTime = new Date(returnRecord.returnTime);
      const timeDiff = (returnTime - reservationEnd) / (1000 * 60);

      const isEarly = returnTime < reservationEnd;
      const isOnTime = timeDiff >= 0 && timeDiff <= 5;

      res.json({
        success: true,
        return: returnRecord,
        statistics: {
          timeDifference:
            Math.abs(Math.round(timeDiff)) +
            " minutos " +
            (timeDiff < 0 ? "antes" : "después"),
          hasFailure: returnRecord.hasFailure,
          isEarly: isEarly,
          isOnTime: isOnTime,
          withinWindow: timeDiff <= 5,
          reservationEnd: reservationEnd,
          actualReturn: returnTime,
        },
      });
    } catch (err) {
      console.error("❌ Error al obtener devolución:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener devolución",
        error: err.message,
      });
    }
  },

  // ========== ACTUALIZAR UNA DEVOLUCIÓN ==========

  updateReturn: async (req, res) => {
    try {
      const { id } = req.params;
      const { returnTime, hasFailure } = req.body;

      const returnRecord = await Return.findByPk(id);

      if (!returnRecord) {
        return res.status(404).json({
          success: false,
          message: "Devolución no encontrada",
        });
      }

      const updateData = {};

      // Actualizar hora de devolución si se proporciona
      if (returnTime) {
        // Verificar el préstamo para recalcular fallo de servicio
        const loan = await Loan.findByPk(returnRecord.loanId, {
          include: [
            {
              model: Reservation,
              attributes: ["endDateTime"],
            },
          ],
        });

        if (loan && loan.Reservation) {
          const reservationEnd = new Date(loan.Reservation.endDateTime);
          const newReturnTime = new Date(returnTime);
          const timeDiff = (newReturnTime - reservationEnd) / (1000 * 60);

          updateData.returnTime = newReturnTime;
          // Solo marca fallo si es DESPUÉS y fuera de ventana
          updateData.hasFailure = timeDiff > 5;
        } else {
          updateData.returnTime = new Date(returnTime);
        }
      }

      // Actualizar fallo de servicio si se proporciona explícitamente
      if (hasFailure !== undefined) {
        updateData.hasFailure = hasFailure;
      }

      // Realizar la actualización
      await returnRecord.update(updateData);

      res.json({
        success: true,
        message: "Devolución actualizada exitosamente",
        return: await Return.findByPk(id, {
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
      console.error("❌ Error al actualizar devolución:", err);

      if (err.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: err.errors.map((e) => e.message).join(", "),
        });
      }

      res.status(500).json({
        success: false,
        message: "Error al actualizar devolución",
        error: err.message,
      });
    }
  },

  // ========== ELIMINAR UNA DEVOLUCIÓN ==========

  deleteReturn: async (req, res) => {
    try {
      const { id } = req.params;

      const returnRecord = await Return.findByPk(id, {
        include: [
          {
            model: Loan,
            attributes: ["id"],
            include: [
              {
                model: Reservation,
                attributes: ["id"],
              },
            ],
          },
        ],
      });

      if (!returnRecord) {
        return res.status(404).json({
          success: false,
          message: "Devolución no encontrada",
        });
      }

      // ✅ Revertir el estado de la reserva a "confirmada" antes de eliminar
      if (returnRecord.Loan?.Reservation) {
        await Reservation.update(
          { status: "confirmada" },
          { where: { id: returnRecord.Loan.Reservation.id } }
        );
      }

      // Eliminar la devolución
      await returnRecord.destroy();

      res.json({
        success: true,
        message: "Devolución eliminada exitosamente",
        deletedReturn: {
          id,
          loanId: returnRecord.loanId,
          returnTime: returnRecord.returnTime,
        },
      });
    } catch (err) {
      console.error("❌ Error al eliminar devolución:", err);
      res.status(500).json({
        success: false,
        message: "Error al eliminar devolución",
        error: err.message,
      });
    }
  },

  // ========== ESTADÍSTICAS DE DEVOLUCIONES ==========

  getReturnStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const whereConditions = {};

      if (startDate && endDate) {
        whereConditions.returnTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      // Conteo total
      const totalReturns = await Return.count({ where: whereConditions });

      // Devoluciones con fallo de servicio
      const returnsWithFailure = await Return.count({
        where: {
          ...whereConditions,
          hasFailure: true,
        },
      });

      // Devoluciones sin fallo
      const returnsWithoutFailure = totalReturns - returnsWithFailure;

      // Devoluciones por empleado
      const returnsByEmployee = await Return.findAll({
        where: whereConditions,
        attributes: ["employeeId", [fn("COUNT", col("Return.id")), "count"]],
        group: ["employeeId", "Employee.id"],
        include: [
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });

      // Devoluciones por unidad (a través del recurso)
      const returnsByUnit = await Return.findAll({
        where: whereConditions,
        attributes: [
          [
            literal('"Loan->Reservation->Resource->ResourceType->Unit"."id"'),
            "unitId",
          ],
          [
            literal('"Loan->Reservation->Resource->ResourceType->Unit"."name"'),
            "unitName",
          ],
          [fn("COUNT", col("Return.id")), "count"],
        ],
        include: [
          {
            model: Loan,
            attributes: [],
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
          },
        ],
        group: [
          "Loan->Reservation->Resource->ResourceType->Unit.id",
          "Loan->Reservation->Resource->ResourceType->Unit.name",
        ],
        raw: true,
      });

      res.json({
        success: true,
        stats: {
          total: totalReturns,
          withFailure: returnsWithFailure,
          withoutFailure: returnsWithoutFailure,
          failureRate:
            totalReturns > 0
              ? ((returnsWithFailure / totalReturns) * 100).toFixed(2) + "%"
              : "0%",
          byEmployee: returnsByEmployee.map((item) => ({
            employeeId: item.employeeId,
            employeeName: item.Employee
              ? `${item.Employee.firstName} ${item.Employee.lastName}`
              : "Desconocido",
            count: parseInt(item.dataValues.count),
          })),
          byUnit: returnsByUnit
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
      console.error("❌ Error al obtener estadísticas de devoluciones:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas",
        error: err.message,
      });
    }
  },

  // ========== OBTENER DEVOLUCIONES POR PRÉSTAMO ==========

  getReturnsByLoan: async (req, res) => {
    try {
      const { loanId } = req.params;

      const returns = await Return.findAll({
        where: { loanId },
        include: [
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName", "email"],
          },
        ],
        order: [["returnTime", "DESC"]],
      });

      res.json({
        success: true,
        returns,
        loanId,
        count: returns.length,
      });
    } catch (err) {
      console.error("❌ Error al obtener devoluciones por préstamo:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener devoluciones",
        error: err.message,
      });
    }
  },

  // ========== OBTENER DEVOLUCIONES POR EMPLEADO ==========

  getReturnsByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      const whereConditions = { employeeId };

      if (startDate && endDate) {
        whereConditions.returnTime = {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        };
      }

      const returns = await Return.findAll({
        where: whereConditions,
        include: [
          {
            model: Loan,
            attributes: ["id", "deliveryTime"],
            include: [
              {
                model: Reservation,
                attributes: ["id", "endDateTime", "purpose", "status"],
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
          },
        ],
        order: [["returnTime", "DESC"]],
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
        returns,
        total: returns.length,
        withFailure: returns.filter((returnRecord) => returnRecord.hasFailure)
          .length,
        withoutFailure: returns.filter(
          (returnRecord) => !returnRecord.hasFailure
        ).length,
      });
    } catch (err) {
      console.error("❌ Error al obtener devoluciones por empleado:", err);
      res.status(500).json({
        success: false,
        message: "Error al obtener devoluciones del empleado",
        error: err.message,
      });
    }
  },

  // ========== VERIFICAR SI EXISTE DEVOLUCIÓN PARA UN PRÉSTAMO ==========

  checkReturnExists: async (req, res) => {
    try {
      const { loanId } = req.params;

      const returnRecord = await Return.findOne({
        where: { loanId },
        include: [
          {
            model: User,
            as: "Employee",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });

      res.json({
        success: true,
        exists: !!returnRecord,
        return: returnRecord,
      });
    } catch (err) {
      console.error("❌ Error al verificar devolución:", err);
      res.status(500).json({
        success: false,
        message: "Error al verificar devolución",
        error: err.message,
      });
    }
  },
};

module.exports = returnController;
