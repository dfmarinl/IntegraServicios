const request = require("supertest");
const app = require("../index");
const { ResourceType, Unit, sequelize } = require("../models");
const jwt = require("jsonwebtoken");

describe("Resource Type Endpoints - HU-002", () => {
  let adminToken;
  let empleadoToken;
  let testUnitId;

  beforeAll(async () => {
    adminToken = jwt.sign(
      { userId: 1, rol: "administrador" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    empleadoToken = jwt.sign(
      { userId: 2, rol: "empleado_unidad" },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
  });

  beforeEach(async () => {
    await ResourceType.destroy({ where: {} });
    await Unit.destroy({ where: {} });

    // Crear unidad de prueba
    const unit = await Unit.create({
      name: "Unidad de Prueba",
      description: "Unidad para testing",
      isActive: true,
    });
    testUnitId = unit.id;

    // Crear tipo de recurso existente
    await ResourceType.create({
      name: "Proyector",
      description: "Proyector multimedia",
      unitId: testUnitId,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // TC04 - Registrar tipo duplicado
  test("Should reject duplicate resource type name", async () => {
    const res = await request(app)
      .post("/api/resource-types")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Proyector", // Nombre duplicado
        description: "Otro proyector",
        unitId: testUnitId,
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message");
  });

  test("Should create resource type with valid data", async () => {
    const res = await request(app)
      .post("/api/resource-types")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Computador Portátil",
        description: "Laptop para préstamo",
        unitId: testUnitId,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "Computador Portátil");
  });

  test("Should reject creation without required fields", async () => {
    const res = await request(app)
      .post("/api/resource-types")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        description: "Sin nombre",
        unitId: testUnitId,
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("message", "El nombre es requerido");
  });
});
