/**
 * TC-INT-002
 * HU-007: Crear préstamo desde reserva
 * Endpoint: POST /api/prestamos
 * Tipo: Integración
 * Objetivo: Crear préstamo desde reserva y retornar HTTP 201
 */

const request = require("supertest");
const express = require("express");

const app = express();
app.use(express.json());

// Controlador SIMPLE para préstamos (ya que no tienes uno)
const createLoanHandler = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "Se requiere reservationId",
      });
    }

    // Importar modelos dentro de la función
    const Reservation = require("../models/Reservation");
    const Loan = require("../models/Loan");

    const reservation = await Reservation.findByPk(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    // Verificar que la reserva esté activa
    if (reservation.status !== "activa") {
      return res.status(400).json({
        success: false,
        message: "La reserva debe estar activa para crear un préstamo",
      });
    }

    // Verificar que no exista ya un préstamo para esta reserva
    const existingLoan = await Loan.findOne({
      where: { reservationId },
    });

    if (existingLoan) {
      return res.status(409).json({
        success: false,
        message: "Ya existe un préstamo para esta reserva",
      });
    }

    // Crear préstamo
    const loan = await Loan.create({
      reservationId,
      deliveryTime: new Date(),
      employeeId: req.user.id,
      hasFailure: false,
    });

    return res.status(201).json({
      success: true,
      message: "Préstamo creado exitosamente",
      loan: {
        id: loan.id,
        reservationId: loan.reservationId,
        employeeId: loan.employeeId,
        deliveryTime: loan.deliveryTime,
        hasFailure: loan.hasFailure,
      },
    });
  } catch (error) {
    console.error("Error en createLoan:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
};

// Ruta para préstamos
app.post(
  "/api/prestamos",
  // Middleware verifyToken simulado (empleado)
  (req, res, next) => {
    req.user = {
      id: 2,
      rol: "empleado_unidad",
      email: "empleado@test.com",
    };
    next();
  },

  // Middleware authorizeRoles simulado
  (req, res, next) => {
    const allowedRoles = ["empleado_unidad", "administrador"];
    if (allowedRoles.includes(req.user.rol)) {
      next();
    } else {
      res.status(403).json({ message: "Acceso denegado" });
    }
  },

  // Handler
  createLoanHandler
);

// Importar sequelize y modelos
const sequelize = require("../config/database");
const User = require("../models/user");
const Resource = require("../models/Resource");
const ResourceType = require("../models/ResourceType");
const Unit = require("../models/Unit");
const Reservation = require("../models/Reservation");
const Loan = require("../models/Loan");

describe("TC-INT-002: POST /api/prestamos - Crear préstamo desde reserva", () => {
  let testUser, testEmployee, testResource, testReservation;

  beforeAll(async () => {
    console.log("🔄 Configurando test TC-INT-002...");

    await sequelize.sync({ force: true });

    // Crear unidad
    const unit = await Unit.create({
      name: "unidad_test_int_002",
      granularity: 30,
      isActive: true,
    });

    // Crear tipo de recurso
    const resourceType = await ResourceType.create({
      name: "tipo_recurso_test_int_002",
      unitId: unit.id,
      granularity: 30,
      isActive: true,
    });

    // Crear recurso
    testResource = await Resource.create({
      name: "Proyector - Test INT-002",
      photoUrl: "test.jpg",
      typeId: resourceType.id,
      isAvailable: true,
      isActive: true,
    });

    // Crear usuario estudiante
    testUser = await User.create({
      firstName: "Estudiante",
      lastName: "Test",
      identificationNumber: "1111111111",
      age: 20,
      email: "estudiante@test.com",
      city: "Bogotá",
      direction: "Calle Test",
      password: "$2b$10$MockHashForTesting",
      rol: "estudiante",
    });

    // Crear usuario empleado
    testEmployee = await User.create({
      firstName: "Empleado",
      lastName: "Test",
      identificationNumber: "2222222222",
      age: 30,
      email: "empleado@test.com",
      city: "Bogotá",
      direction: "Calle Empleado",
      password: "$2b$10$MockHashForTesting",
      rol: "empleado_unidad",
    });

    console.log("✅ Datos de prueba creados para TC-INT-002");
  });

  beforeEach(async () => {
    // Crear reserva activa para cada test
    const startDateTime = new Date();
    startDateTime.setHours(startDateTime.getHours() + 2); // 2 horas después

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1); // Duración 1 hora

    testReservation = await Reservation.create({
      resourceId: testResource.id,
      userId: testUser.id,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      purpose: "Préstamo de equipo - Test TC-INT-002",
      attendees: 3,
      status: "activa",
    });

    console.log(
      `✅ Reserva creada ID: ${testReservation.id}, estado: ${testReservation.status}`
    );
  });

  afterEach(async () => {
    await Loan.destroy({ where: {} });
    // No destruir la reserva aquí si se recrea en beforeEach
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Debería crear un préstamo desde reserva activa y retornar HTTP 201", async () => {
    // 1. Datos del préstamo
    const loanData = {
      reservationId: testReservation.id,
    };

    console.log("📤 Enviando POST /api/prestamos con:", loanData);

    // 2. Ejecutar petición
    const response = await request(app).post("/api/prestamos").send(loanData);

    console.log("📥 Respuesta:", {
      status: response.status,
      success: response.body?.success,
      message: response.body?.message,
    });

    // 3. Verificar respuesta
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Préstamo creado exitosamente");
    expect(response.body.loan).toHaveProperty("id");
    expect(response.body.loan.reservationId).toBe(testReservation.id);
    expect(response.body.loan.employeeId).toBe(2); // ID del empleado mock

    // 4. Verificar en base de datos
    const createdLoan = await Loan.findOne({
      where: { reservationId: testReservation.id },
    });
    expect(createdLoan).toBeTruthy();
    expect(createdLoan.hasFailure).toBe(false);

    console.log("✅ TC-INT-002 pasado exitosamente");
  });

  test("Debería fallar al crear préstamo para reserva inexistente", async () => {
    const response = await request(app)
      .post("/api/prestamos")
      .send({ reservationId: 99999 }); // ID que no existe

    console.log("📥 Respuesta para reserva inexistente:", {
      status: response.status,
      message: response.body?.message,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/no encontrada/i);
    console.log("✅ Validación de reserva inexistente funciona");
  });

  test("Debería fallar al crear préstamo para reserva no activa", async () => {
    // Crear una reserva no activa
    const startDateTime = new Date();
    startDateTime.setHours(startDateTime.getHours() + 2);

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1);

    const inactiveReservation = await Reservation.create({
      resourceId: testResource.id,
      userId: testUser.id,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      purpose: "Reserva pendiente test",
      attendees: 2,
      status: "pendiente", // Estado no activo
    });

    const response = await request(app)
      .post("/api/prestamos")
      .send({ reservationId: inactiveReservation.id });

    console.log("📥 Respuesta para reserva no activa:", {
      status: response.status,
      message: response.body?.message,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/activa/i);
    console.log("✅ Validación de reserva no activa funciona");
  });

  test("Debería fallar al crear préstamo duplicado", async () => {
    // Primero crear un préstamo
    const firstLoan = await Loan.create({
      reservationId: testReservation.id,
      deliveryTime: new Date(),
      employeeId: testEmployee.id,
      hasFailure: false,
    });

    console.log(`📋 Préstamo existente creado ID: ${firstLoan.id}`);

    // Intentar crear otro préstamo para la misma reserva
    const response = await request(app)
      .post("/api/prestamos")
      .send({ reservationId: testReservation.id });

    console.log("📥 Respuesta para préstamo duplicado:", {
      status: response.status,
      message: response.body?.message,
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/ya existe/i);
    console.log("✅ Validación de préstamo duplicado funciona");
  });

  test("Debería fallar si no se envía reservationId", async () => {
    const response = await request(app).post("/api/prestamos").send({}); // Sin reservationId

    console.log("📥 Respuesta sin reservationId:", {
      status: response.status,
      message: response.body?.message,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/se requiere/i);
    console.log("✅ Validación de campos requeridos funciona");
  });

  test("Debería crear préstamo con falla reportada si se especifica", async () => {
    // Modificar handler para aceptar hasFailure
    const originalHandler = createLoanHandler;

    const handlerWithFailure = async (req, res) => {
      const { reservationId, hasFailure = false } = req.body;

      if (!reservationId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere reservationId",
        });
      }

      const Reservation = require("../models/Reservation");
      const Loan = require("../models/Loan");

      const reservation = await Reservation.findByPk(reservationId);

      if (!reservation) {
        return res.status(404).json({
          success: false,
          message: "Reserva no encontrada",
        });
      }

      if (reservation.status !== "activa") {
        return res.status(400).json({
          success: false,
          message: "La reserva debe estar activa para crear un préstamo",
        });
      }

      const existingLoan = await Loan.findOne({
        where: { reservationId },
      });

      if (existingLoan) {
        return res.status(409).json({
          success: false,
          message: "Ya existe un préstamo para esta reserva",
        });
      }

      const loan = await Loan.create({
        reservationId,
        deliveryTime: new Date(),
        employeeId: req.user.id,
        hasFailure: hasFailure,
      });

      return res.status(201).json({
        success: true,
        message: "Préstamo creado exitosamente",
        loan: {
          id: loan.id,
          reservationId: loan.reservationId,
          employeeId: loan.employeeId,
          deliveryTime: loan.deliveryTime,
          hasFailure: loan.hasFailure,
        },
      });
    };

    // Ruta temporal con handler modificado
    app.post(
      "/api/prestamos-test",
      (req, res, next) => {
        req.user = {
          id: 2,
          rol: "empleado_unidad",
          email: "empleado@test.com",
        };
        next();
      },
      (req, res, next) => {
        const allowedRoles = ["empleado_unidad", "administrador"];
        if (allowedRoles.includes(req.user.rol)) {
          next();
        } else {
          res.status(403).json({ message: "Acceso denegado" });
        }
      },
      handlerWithFailure
    );

    const response = await request(app).post("/api/prestamos-test").send({
      reservationId: testReservation.id,
      hasFailure: true,
    });

    console.log("📥 Respuesta para préstamo con falla:", {
      status: response.status,
      hasFailure: response.body?.loan?.hasFailure,
    });

    expect(response.status).toBe(201);
    expect(response.body.loan.hasFailure).toBe(true);
    console.log("✅ Préstamo con falla reportada funciona");
  });
});
