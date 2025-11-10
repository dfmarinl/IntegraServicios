const request = require("supertest");
const app = require("../index");
const { User, sequelize } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

describe("Auth Endpoints", () => {
  let authToken;
  let testUserId;

  beforeEach(async () => {
    await User.destroy({ where: {} });

    // Hashear la contraseña correctamente
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Crear usuario de prueba
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
    authToken = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      firstName: "New",
      lastName: "User",
      identificationNumber: "111111111",
      age: 30,
      email: "new@test.com",
      city: "Medellín",
      direction: "Carrera 50 # 80-10",
      password: "password123",
      rol: "estudiante",
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
  });

  test("Should login user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@test.com",
      password: "password123",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
  });

  test("Should not login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test@test.com",
      password: "wrongpassword",
    });
    expect(res.statusCode).toEqual(401);
  });

  test("Should get user profile with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("email", "test@test.com");
    expect(res.body).not.toHaveProperty("password");
  });

  test("Should not get profile without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toEqual(403);
  });

  test("Should verify current password correctly", async () => {
    const res = await request(app)
      .post("/api/auth/verify-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ currentPassword: "password123" });

    expect(res.statusCode).toEqual(200);
  });

  test("Should update password with valid token", async () => {
    const res = await request(app)
      .post("/api/auth/update-password")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ newPassword: "newPassword123" });

    expect(res.statusCode).toEqual(200);
  });

  test("Should update user profile", async () => {
    const res = await request(app)
      .post("/api/auth/update-profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        firstName: "Updated",
        lastName: "Name",
        identificationNumber: "123456789",
        age: 26,
        email: "test@test.com",
        city: "Cali",
        direction: "New Address 123",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.user.firstName).toEqual("Updated");
  });

  test("Should not update profile with missing fields", async () => {
    const res = await request(app)
      .post("/api/auth/update-profile")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        firstName: "Updated",
      });

    expect(res.statusCode).toEqual(400);
  });
});
