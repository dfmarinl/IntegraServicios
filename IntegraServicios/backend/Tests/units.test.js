const request = require("supertest");
const app = require("../index");
const sequelize = require("../models/index").sequelize;

describe("Unit Management Endpoints - HU-015", () => {
  let adminToken;
  let empleadoToken;

  beforeAll(async () => {
    adminToken = require("jsonwebtoken").sign(
      { userId: 1, rol: "administrador" },
      process.env.JWT_SECRET_KEY || "secret_key_test",
      { expiresIn: "1h" }
    );

    empleadoToken = require("jsonwebtoken").sign(
      { userId: 2, rol: "empleado_unidad" },
      process.env.JWT_SECRET_KEY || "secret_key_test",
      { expiresIn: "1h" }
    );
  });

  beforeEach(async () => {
    try {
      // Limpiar unidades
      await sequelize.query('DELETE FROM "Units" WHERE id IS NOT NULL');
    } catch (error) {
      console.log("Error limpiando unidades:", error.message);
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Should create unit with admin token", async () => {
    const res = await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "biblioteca central test",
        description: "Biblioteca principal del campus",
        granularity: 30,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("name", "biblioteca central test");
  });

  test("Should reject duplicate unit name", async () => {
    // Crear primera unidad
    await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "biblioteca duplicada",
        description: "Unidad existente",
      });

    // Intentar crear duplicado
    const res = await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "biblioteca duplicada", // Mismo nombre
        description: "Nueva descripción",
      });

    expect(res.statusCode).toEqual(400);
  });

  test("Should reject creation with invalid granularity", async () => {
    const res = await request(app)
      .post("/api/units")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "unidad test granularidad",
        description: "Unidad con granularidad inválida",
        granularity: 10, // Menor a 15 minutos
      });

    expect(res.statusCode).toEqual(400);
  });

  test("Should get all units", async () => {
    const res = await request(app)
      .get("/api/units")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
