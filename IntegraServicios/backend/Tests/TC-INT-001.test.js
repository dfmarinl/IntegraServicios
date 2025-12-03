/**
 * TC-INT-001
 * HU-006: Crear reserva válida
 * Endpoint: POST /api/reservas
 * Tipo: Integración
 * Objetivo: Crear reserva válida y retornar HTTP 201
 */

const request = require("supertest");
const express = require("express");

// Configurar app Express
const app = express();
app.use(express.json());

// Importar controlador real
const reservationController = require("./../services/reservation/src/api/views/reservationController");

// Configurar ruta CON MIDDLEWARE SIMULADO
app.post(
  "/api/reservas",
  // Middleware verifyToken simulado
  (req, res, next) => {
    req.user = {
      id: 1,
      rol: "estudiante",
      email: "estudiante@test.com",
    };
    next();
  },

  // Middleware authorizeRoles simulado
  (req, res, next) => {
    const allowedRoles = ["estudiante", "docente", "personal_administrativo"];
    if (allowedRoles.includes(req.user.rol)) {
      next();
    } else {
      res.status(403).json({ message: "Acceso denegado" });
    }
  },

  // Controlador real
  reservationController.createReservation
);

// Importar sequelize y modelos
const sequelize = require("../config/database");
const User = require("../models/user");
const Resource = require("../models/Resource");
const ResourceType = require("../models/ResourceType");
const Unit = require("../models/Unit");
const Reservation = require("../models/Reservation");
const TypeSchedule = require("../models/TypeSchedule");

describe("TC-INT-001: POST /api/reservas - Crear reserva válida", () => {
  let testUser, testResource, testResourceType, testUnit, testSchedule;

  beforeAll(async () => {
    console.log("🔄 Configurando test TC-INT-001...");

    // Sincronizar BD
    await sequelize.sync({ force: true });

    // Crear datos de prueba
    testUnit = await Unit.create({
      name: "unidad_test_int_001",
      description: "Unidad para test de integración 001",
      granularity: 30,
      isActive: true,
    });

    testResourceType = await ResourceType.create({
      name: "tipo_recurso_test_int_001",
      unitId: testUnit.id,
      granularity: 30,
      isActive: true,
    });

    testResource = await Resource.create({
      name: "Aula 101 - Test INT-001",
      photoUrl: "https://example.com/test.jpg",
      typeId: testResourceType.id,
      isAvailable: true,
      isActive: true,
      features: JSON.stringify({ capacidad: 20, proyector: true }),
    });

    // Crear usuario
    testUser = await User.create({
      firstName: "Test",
      lastName: "Usuario",
      identificationNumber: "1112223334",
      age: 22,
      email: "test.usuario@example.com",
      city: "Bogotá",
      direction: "Calle 123",
      password: "$2b$10$MockHashForTesting",
      rol: "estudiante",
      isActive: true,
    });

    console.log("✅ Datos de prueba creados");
  });

  beforeEach(async () => {
    // Crear horario para el día de MAÑANA (no hoy)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayMap = {
      0: "domingo",
      1: "lunes",
      2: "martes",
      3: "miercoles",
      4: "jueves",
      5: "viernes",
      6: "sabado",
    };

    const tomorrowDayName = dayMap[tomorrow.getDay()];

    // Eliminar horario existente si hay
    await TypeSchedule.destroy({ where: { typeId: testResourceType.id } });

    // Crear nuevo horario para el día de mañana
    testSchedule = await TypeSchedule.create({
      typeId: testResourceType.id,
      dayOfWeek: tomorrowDayName,
      startTime: "08:00:00",
      endTime: "20:00:00",
      isActive: true,
    });

    console.log(`✅ Horario creado para ${tomorrowDayName} (mañana)`);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Limpiar reservas y horarios
    await Reservation.destroy({ where: {} });
    await TypeSchedule.destroy({ where: { typeId: testResourceType.id } });
  });

  test("Debería crear una reserva única válida y retornar HTTP 201", async () => {
    // 1. Preparar datos (reserva para MAÑANA)
    const startDateTime = new Date();
    startDateTime.setDate(startDateTime.getDate() + 1); // Mañana
    startDateTime.setHours(10, 0, 0, 0); // 10:00 AM

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(11, 0, 0, 0); // 11:00 AM

    const reservationData = {
      resourceId: testResource.id,
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      purpose: "Reunión de estudio - Test TC-INT-001",
      attendees: 5,
      isRepetitive: false,
    };

    console.log("📤 Enviando POST /api/reservas con:", {
      resourceId: reservationData.resourceId,
      purpose: reservationData.purpose,
      startDateTime: reservationData.startDateTime,
      endDateTime: reservationData.endDateTime,
    });

    // 2. Ejecutar petición
    const response = await request(app)
      .post("/api/reservas")
      .send(reservationData)
      .set("Accept", "application/json");

    console.log("📥 Respuesta:", {
      status: response.status,
      message: response.body?.message,
    });

    // 3. Verificar respuesta HTTP
    if (response.status !== 201) {
      console.error("❌ Error en la respuesta:", response.body);
    }

    expect(response.status).toBe(201);

    // 4. Verificar estructura de respuesta
    expect(response.body).toHaveProperty("message");
    expect(typeof response.body.message).toBe("string");
    expect(response.body.message).toMatch(/creada exitosamente/i);

    // 5. Verificar en base de datos
    const createdReservation = await Reservation.findOne({
      where: { purpose: "Reunión de estudio - Test TC-INT-001" },
    });

    expect(createdReservation).toBeTruthy();
    expect(createdReservation.resourceId).toBe(testResource.id);
    expect(createdReservation.attendees).toBe(5);
    expect(createdReservation.status).toBe("pendiente");

    console.log("✅ TC-INT-001 pasado exitosamente");
  });

  test("Debería fallar con datos incompletos (HTTP 400)", async () => {
    const invalidData = {
      // Solo attendees, faltan campos obligatorios
      attendees: 3,
    };

    const response = await request(app).post("/api/reservas").send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/requeridos/i);
    console.log("✅ Validación de datos funciona:", response.body.message);
  });

  test("Debería fallar con fechas en el pasado", async () => {
    const pastData = {
      resourceId: testResource.id,
      startDateTime: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      endDateTime: new Date().toISOString(), // ahora
      purpose: "Reserva en pasado",
      attendees: 2,
      isRepetitive: false,
    };

    const response = await request(app).post("/api/reservas").send(pastData);

    console.log("📥 Respuesta para fecha pasada:", {
      status: response.status,
      message: response.body?.message,
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/pasado/i);
  });

  test("Debería fallar si el recurso no está disponible", async () => {
    // Crear un recurso NO disponible
    const unavailableResource = await Resource.create({
      name: "Recurso No Disponible",
      photoUrl: "test.jpg",
      typeId: testResourceType.id,
      isAvailable: false, // ¡NO DISPONIBLE!
      isActive: true,
    });

    const reservationData = {
      resourceId: unavailableResource.id,
      startDateTime: new Date(Date.now() + 86400000).toISOString(), // mañana
      endDateTime: new Date(Date.now() + 90000000).toISOString(), // mañana + 1 hora
      purpose: "Reserva recurso no disponible",
      attendees: 3,
      isRepetitive: false,
    };

    const response = await request(app)
      .post("/api/reservas")
      .send(reservationData);

    console.log("📥 Respuesta para recurso no disponible:", {
      status: response.status,
      message: response.body?.message,
    });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toMatch(/no disponible/i);
  });
});
