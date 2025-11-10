const request = require("supertest");
const app = require("../index");
const { User, sequelize } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

describe("User Management Endpoints", () => {
  let adminToken;
  let empleadoToken;
  let testUserId;

  beforeAll(async () => {
    // Crear tokens para diferentes roles
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
    await User.destroy({ where: {} });

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash("password123", 10);
    const user = await User.create({
      firstName: "Test",
      lastName: "User",
      identificationNumber: "123456789",
      age: 25,
      email: "test@test.com",
      city: "Bogotá",
      direction: "Calle 123 # 45-67",
      password: hashedPassword,
      rol: "estudiante",
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Should create user with admin token", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "New",
        lastName: "User",
        identificationNumber: "111111111",
        age: 30,
        email: "new@test.com",
        password: "password123",
        city: "Medellín",
        direction: "Carrera 50 # 80-10",
        rol: "docente",
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("email", "new@test.com");
    expect(res.body).not.toHaveProperty("password");
  });

  test("Should create user with empleado_unidad token", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${empleadoToken}`)
      .send({
        firstName: "Empleado",
        lastName: "Created",
        identificationNumber: "222222222",
        age: 28,
        email: "empleado@test.com",
        password: "password123",
        city: "Cali",
        direction: "Avenida 10 # 20-30",
        rol: "estudiante",
      });

    expect(res.statusCode).toEqual(201);
  });

  test("Should not create user without token", async () => {
    const res = await request(app).post("/api/users").send({
      firstName: "No",
      lastName: "Token",
      identificationNumber: "333333333",
      age: 22,
      email: "notoken@test.com",
      password: "password123",
      city: "Bogotá",
      direction: "Calle 1 # 2-3",
    });

    expect(res.statusCode).toEqual(403);
  });

  test("Should get all users with admin token", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("Should get paginated users with admin token", async () => {
    const res = await request(app)
      .get("/api/users/paginado?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("users");
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("totalPages");
  });

  test("Should not get paginated users with empleado_unidad token", async () => {
    const res = await request(app)
      .get("/api/users/paginado")
      .set("Authorization", `Bearer ${empleadoToken}`);

    expect(res.statusCode).toEqual(403);
  });

  test("Should get user by ID with admin token", async () => {
    const res = await request(app)
      .get(`/api/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("id", testUserId);
  });

  test("Should update user with admin token", async () => {
    const res = await request(app)
      .put(`/api/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Updated",
        city: "Nueva Ciudad",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.firstName).toEqual("Updated");
  });

  test("Should delete user with admin token", async () => {
    const res = await request(app)
      .delete(`/api/users/${testUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);

    // Verificar que el usuario fue eliminado
    const deletedUser = await User.findByPk(testUserId);
    expect(deletedUser).toBeNull();
  });

  test("Should return 404 for non-existent user", async () => {
    const res = await request(app)
      .get("/api/users/9999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(404);
  });

  test("Should not create user with missing required fields", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Incomplete",
        // Faltan otros campos requeridos
      });

    expect(res.statusCode).toEqual(400);
  });
});
