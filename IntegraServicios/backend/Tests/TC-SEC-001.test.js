// Tests/TC-SEC-001.test.js
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../index"); // Tu app Express
const User = require("../models/user");
const bcrypt = require("bcrypt");
const sequelize = require("../config/database");

describe("TC-SEC-001: Middleware auth - HU-016 (Gestión de usuarios y empleados)", () => {
  let adminUser, estudianteUser, empleadoUser, docenteUser, personalAdminUser;
  let adminToken,
    estudianteToken,
    empleadoToken,
    docenteToken,
    personalAdminToken;
  let testCounter = 0; // Para generar datos únicos

  // Configurar datos de prueba antes de todos los tests
  beforeAll(async () => {
    testCounter = Date.now();

    // Crear usuario administrador
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    adminUser = await User.create({
      firstName: "Admin",
      lastName: "Sistema",
      identificationNumber: `admin-${testCounter}`,
      age: 35,
      email: `admin.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle Admin 123",
      password: adminPassword,
      rol: "administrador",
      isActive: true,
    });

    // Crear usuario estudiante
    const estudiantePassword = await bcrypt.hash("Estudiante123!", 10);
    estudianteUser = await User.create({
      firstName: "Carlos",
      lastName: "Estudiante",
      identificationNumber: `est-${testCounter}`,
      age: 20,
      email: `estudiante.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle 45 #12-34",
      password: estudiantePassword,
      rol: "estudiante",
      isActive: true,
    });

    // Crear usuario empleado_unidad
    const empleadoPassword = await bcrypt.hash("Empleado123!", 10);
    empleadoUser = await User.create({
      firstName: "María",
      lastName: "Empleada",
      identificationNumber: `emp-${testCounter}`,
      age: 30,
      email: `empleado.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Carrera 10 #20-30",
      password: empleadoPassword,
      rol: "empleado_unidad",
      isActive: true,
    });

    // Crear usuario docente
    const docentePassword = await bcrypt.hash("Docente123!", 10);
    docenteUser = await User.create({
      firstName: "Profesor",
      lastName: "Docente",
      identificationNumber: `doc-${testCounter}`,
      age: 45,
      email: `docente.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Av Universitaria 123",
      password: docentePassword,
      rol: "docente",
      isActive: true,
    });

    // Crear usuario personal_administrativo
    const personalPassword = await bcrypt.hash("Personal123!", 10);
    personalAdminUser = await User.create({
      firstName: "Ana",
      lastName: "Administrativa",
      identificationNumber: `per-${testCounter}`,
      age: 38,
      email: `personal.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle 100 #50-60",
      password: personalPassword,
      rol: "personal_administrativo",
      isActive: true,
    });

    // Generar tokens JWT
    const jwtSecret = process.env.JWT_SECRET_KEY || "test-secret-key-for-jwt";

    adminToken = jwt.sign(
      { userId: adminUser.id, rol: adminUser.rol },
      jwtSecret,
      { expiresIn: "1h" }
    );

    estudianteToken = jwt.sign(
      { userId: estudianteUser.id, rol: estudianteUser.rol },
      jwtSecret,
      { expiresIn: "1h" }
    );

    empleadoToken = jwt.sign(
      { userId: empleadoUser.id, rol: empleadoUser.rol },
      jwtSecret,
      { expiresIn: "1h" }
    );

    docenteToken = jwt.sign(
      { userId: docenteUser.id, rol: docenteUser.rol },
      jwtSecret,
      { expiresIn: "1h" }
    );

    personalAdminToken = jwt.sign(
      { userId: personalAdminUser.id, rol: personalAdminUser.rol },
      jwtSecret,
      { expiresIn: "1h" }
    );
  });

  // Limpiar después de todos los tests
  afterAll(async () => {
    // Eliminar usuarios de prueba
    const users = [
      adminUser,
      estudianteUser,
      empleadoUser,
      docenteUser,
      personalAdminUser,
    ];
    for (const user of users) {
      if (user) await user.destroy();
    }
  });

  // ============================================
  // PRUEBA 1: CREACIÓN DE USUARIO (ÉXITO)
  // ============================================
  test("1. HU-016: Administrador puede crear usuario exitosamente", async () => {
    console.log("1. Probando creación de usuario por administrador...");

    const nuevoUsuario = {
      firstName: "Nuevo",
      lastName: "Usuario",
      identificationNumber: `new-${testCounter}-1`,
      age: 25,
      email: `nuevo.${testCounter}-1@test.com`,
      password: "Password123!",
      rol: "estudiante",
      city: "Medellín",
      direction: "Calle Nueva 123",
    };

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(nuevoUsuario);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe(nuevoUsuario.email);
    expect(response.body.rol).toBe(nuevoUsuario.rol);
    expect(response.body.password).toBeUndefined(); // No debe incluir password

    // Verificar que se creó en la base de datos
    const usuarioCreado = await User.findByPk(response.body.id);
    expect(usuarioCreado).not.toBeNull();
    expect(usuarioCreado.isActive).toBe(true);

    // Limpiar
    await usuarioCreado.destroy();

    console.log("✅ Administrador puede crear usuario (HTTP 201)");
  });

  // ============================================
  // PRUEBA 2: CREACIÓN DE USUARIO CON EMAIL DUPLICADO (FALLO)
  // ============================================
  test("2. HU-016: Error al crear usuario con email duplicado", async () => {
    console.log("2. Probando creación con email duplicado...");

    const usuarioDuplicado = {
      firstName: "Duplicado",
      lastName: "Usuario",
      identificationNumber: `dup-${testCounter}`,
      age: 30,
      email: estudianteUser.email, // Email ya existente
      password: "Password123!",
      rol: "docente",
      city: "Cali",
      direction: "Calle Duplicado 456",
    };

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(usuarioDuplicado);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("already registered");

    console.log("✅ Sistema previene email duplicado (HTTP 400)");
  });

  // ============================================
  // PRUEBA 3: EDICIÓN DE USUARIO (ÉXITO)
  // ============================================
  test("3. HU-016: Administrador puede editar usuario", async () => {
    console.log("3. Probando edición de usuario por administrador...");

    // Crear usuario temporal para editar
    const tempPassword = await bcrypt.hash("Temp123!", 10);
    const tempUser = await User.create({
      firstName: "Temp",
      lastName: "Editar",
      identificationNumber: `temp-edit-${testCounter}`,
      age: 28,
      email: `temp.edit.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle Temp 123",
      password: tempPassword,
      rol: "estudiante",
      isActive: true,
    });

    const datosActualizacion = {
      firstName: "Actualizado",
      lastName: "Usuario",
      age: 29,
      city: "Barranquilla",
      direction: "Nueva dirección 789",
      rol: "personal_administrativo",
    };

    const response = await request(app)
      .put(`/api/users/${tempUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(datosActualizacion);

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe(datosActualizacion.firstName);
    expect(response.body.lastName).toBe(datosActualizacion.lastName);
    expect(response.body.rol).toBe(datosActualizacion.rol);
    expect(response.body.city).toBe(datosActualizacion.city);

    // Verificar en BD
    const usuarioActualizado = await User.findByPk(tempUser.id);
    expect(usuarioActualizado.firstName).toBe(datosActualizacion.firstName);
    expect(usuarioActualizado.rol).toBe(datosActualizacion.rol);

    // Limpiar
    await usuarioActualizado.destroy();

    console.log("✅ Administrador puede editar usuario (HTTP 200)");
  });

  // ============================================
  // PRUEBA 4: ELIMINACIÓN LÓGICA DE USUARIO (ÉXITO)
  // ============================================
  test("4. HU-016: Administrador puede dar de baja usuario (eliminación lógica)", async () => {
    console.log("4. Probando eliminación lógica de usuario...");

    // Crear usuario temporal para eliminar
    const tempPassword = await bcrypt.hash("Temp123!", 10);
    const tempUser = await User.create({
      firstName: "Para",
      lastName: "Eliminar",
      identificationNumber: `del-${testCounter}`,
      age: 32,
      email: `delete.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle Eliminar 123",
      password: tempPassword,
      rol: "empleado_unidad",
      isActive: true,
    });

    const response = await request(app)
      .delete(`/api/users/${tempUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("deactivated successfully");
    expect(response.body.user.isActive).toBe(false);

    // Verificar eliminación lógica en BD
    const usuarioEliminado = await User.findByPk(tempUser.id);
    expect(usuarioEliminado.isActive).toBe(false);

    // Limpiar
    await usuarioEliminado.destroy();

    console.log("✅ Administrador puede dar de baja usuario (HTTP 200)");
  });

  // ============================================
  // PRUEBA 5: REACTIVACIÓN DE USUARIO (ÉXITO)
  // ============================================
  test("5. HU-016: Administrador puede reactivar usuario", async () => {
    console.log("5. Probando reactivación de usuario...");

    // Crear usuario inactivo
    const tempPassword = await bcrypt.hash("Temp123!", 10);
    const tempUser = await User.create({
      firstName: "Inactivo",
      lastName: "Usuario",
      identificationNumber: `inact-${testCounter}`,
      age: 40,
      email: `inactive.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle Inactivo 123",
      password: tempPassword,
      rol: "docente",
      isActive: false, // Usuario inactivo
    });

    const response = await request(app)
      .put(`/api/users/${tempUser.id}/activate`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain("activated successfully");
    expect(response.body.user.isActive).toBe(true);

    // Verificar en BD
    const usuarioReactivo = await User.findByPk(tempUser.id);
    expect(usuarioReactivo.isActive).toBe(true);

    // Limpiar
    await usuarioReactivo.destroy();

    console.log("✅ Administrador puede reactivar usuario (HTTP 200)");
  });

  // ============================================
  // PRUEBA 6: ACCESO DENEGADO PARA NO ADMINISTRADORES
  // ============================================
  test("6. HU-016: Usuario no administrador no puede crear usuario", async () => {
    console.log("6. Probando acceso denegado para estudiante...");

    const nuevoUsuario = {
      firstName: "No",
      lastName: "Autorizado",
      identificationNumber: `noauth-${testCounter}`,
      age: 22,
      email: `noauth.${testCounter}@test.com`,
      password: "Password123!",
      rol: "estudiante",
      city: "Bogotá",
      direction: "Calle NoAuth 123",
    };

    // Probar con estudiante (debería fallar)
    const responseEstudiante = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${estudianteToken}`)
      .send(nuevoUsuario);

    expect(responseEstudiante.status).toBe(403);
    expect(responseEstudiante.body.message).toContain("No tienes permisos");

    // Probar con docente (debería fallar)
    const responseDocente = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${docenteToken}`)
      .send(nuevoUsuario);

    expect(responseDocente.status).toBe(403);

    // Probar con personal administrativo (debería fallar)
    const responsePersonal = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${personalAdminToken}`)
      .send(nuevoUsuario);

    expect(responsePersonal.status).toBe(403);

    console.log(
      "✅ Solo administrador puede crear usuarios (HTTP 403 para otros roles)"
    );
  });

  // ============================================
  // PRUEBA 7: VALIDACIÓN DE ROLES EN CREACIÓN
  // ============================================
  test("7. HU-016: Validación de roles permitidos en creación", async () => {
    console.log("7. Probando creación con diferentes roles...");

    const rolesPermitidos = [
      "estudiante",
      "docente",
      "personal_administrativo",
      "empleado_unidad",
      "administrador",
    ];

    for (const rol of rolesPermitidos) {
      const usuarioRol = {
        firstName: `Usuario`,
        lastName: rol,
        identificationNumber: `role-${rol}-${testCounter}`,
        age: 25,
        email: `role.${rol}.${testCounter}@test.com`,
        password: "Password123!",
        rol: rol,
        city: "Bogotá",
        direction: "Calle Role 123",
      };

      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(usuarioRol);

      expect(response.status).toBe(201);
      expect(response.body.rol).toBe(rol);

      // Limpiar
      const usuarioCreado = await User.findByPk(response.body.id);
      await usuarioCreado.destroy();
    }

    console.log("✅ Administrador puede crear usuarios con todos los roles");
  });

  // ============================================
  // PRUEBA 8: VALIDACIÓN DE CAMPOS REQUERIDOS
  // ============================================
  test("8. HU-016: Validación de campos requeridos en creación", async () => {
    console.log("8. Probando validación de campos requeridos...");

    // Caso 1: Falta email
    const usuarioSinEmail = {
      firstName: "Sin",
      lastName: "Email",
      identificationNumber: `noemail-${testCounter}`,
      age: 25,
      password: "Password123!",
      rol: "estudiante",
      city: "Bogotá",
      direction: "Calle Sin Email 123",
    };

    const response1 = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(usuarioSinEmail);

    expect(response1.status).toBe(400);
    expect(response1.body.message).toContain("Missing required fields");

    // Caso 2: Falta contraseña
    const usuarioSinPassword = {
      firstName: "Sin",
      lastName: "Password",
      identificationNumber: `nopass-${testCounter}`,
      age: 25,
      email: `nopass.${testCounter}@test.com`,
      rol: "estudiante",
      city: "Bogotá",
      direction: "Calle Sin Pass 123",
    };

    const response2 = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(usuarioSinPassword);

    expect(response2.status).toBe(400);

    console.log("✅ Sistema valida campos requeridos (HTTP 400)");
  });

  // ============================================
  // PRUEBA 9: OBTENER USUARIOS PAGINADOS (SOLO ADMIN)
  // ============================================
  test("9. HU-016: Solo administrador puede ver usuarios paginados", async () => {
    console.log("9. Probando acceso a usuarios paginados...");

    // Administrador sí puede
    const responseAdmin = await request(app)
      .get("/api/users/paginado")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(responseAdmin.status).toBe(200);
    expect(responseAdmin.body).toHaveProperty("users");
    expect(responseAdmin.body).toHaveProperty("total");

    // Empleado no puede (solo administrador según tus rutas)
    const responseEmpleado = await request(app)
      .get("/api/users/paginado")
      .set("Authorization", `Bearer ${empleadoToken}`);

    expect(responseEmpleado.status).toBe(403);

    console.log("✅ Solo administrador accede a /api/users/paginado");
  });

  // ============================================
  // PRUEBA 10: OBTENER USUARIO POR ID
  // ============================================
  test("10. HU-016: Administrador y empleado pueden ver usuario específico", async () => {
    console.log("10. Probando acceso a usuario específico...");

    // Administrador puede
    const responseAdmin = await request(app)
      .get(`/api/users/${estudianteUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(responseAdmin.status).toBe(200);
    expect(responseAdmin.body.id).toBe(estudianteUser.id);

    // Empleado_unidad puede (según tus rutas)
    const responseEmpleado = await request(app)
      .get(`/api/users/${estudianteUser.id}`)
      .set("Authorization", `Bearer ${empleadoToken}`);

    expect(responseEmpleado.status).toBe(200);

    // Estudiante NO puede
    const responseEstudiante = await request(app)
      .get(`/api/users/${adminUser.id}`)
      .set("Authorization", `Bearer ${estudianteToken}`);

    expect(responseEstudiante.status).toBe(403);

    console.log("✅ Administrador y empleado pueden ver usuario específico");
  });

  // ============================================
  // PRUEBA 11: CREACIÓN POR EMPLEADO_UNIDAD (SEGÚN TUS RUTAS)
  // ============================================
  test("11. HU-016: Empleado_unidad también puede crear usuarios", async () => {
    console.log("11. Probando creación por empleado_unidad...");

    // Según tus rutas, empleado_unidad SÍ puede crear usuarios
    const nuevoUsuario = {
      firstName: "Creado",
      lastName: "Por Empleado",
      identificationNumber: `emp-crea-${testCounter}`,
      age: 27,
      email: `empcrea.${testCounter}@test.com`,
      password: "Password123!",
      rol: "estudiante", // Nota: ¿empleado_unidad puede crear administradores?
      city: "Bogotá",
      direction: "Calle Empleado Crea 123",
    };

    const response = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${empleadoToken}`)
      .send(nuevoUsuario);

    // Según tus rutas, esto debería ser 201 (empleado_unidad está en authorizeRoles)
    expect(response.status).toBe(201);

    if (response.body.id) {
      const usuarioCreado = await User.findByPk(response.body.id);
      await usuarioCreado.destroy();
    }

    console.log(
      "✅ Empleado_unidad puede crear usuarios (según configuración de rutas)"
    );
  });

  // ============================================
  // PRUEBA 12: VERIFICACIÓN DE USUARIOS ACTIVOS/INACTIVOS
  // ============================================
  test("12. HU-016: Lista de usuarios activos vs todos", async () => {
    console.log("12. Probando listas de usuarios activos vs completos...");

    // Crear usuario inactivo temporal
    const tempPassword = await bcrypt.hash("Temp123!", 10);
    const tempInactiveUser = await User.create({
      firstName: "Inactivo",
      lastName: "Temp",
      identificationNumber: `inact-temp-${testCounter}`,
      age: 50,
      email: `inactive.temp.${testCounter}@test.com`,
      city: "Bogotá",
      direction: "Calle Inactivo Temp 123",
      password: tempPassword,
      rol: "docente",
      isActive: false,
    });

    // /api/users/active (solo activos)
    const responseActive = await request(app)
      .get("/api/users/active")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(responseActive.status).toBe(200);
    const soloActivos = responseActive.body.every(
      (user) => user.isActive === true
    );
    expect(soloActivos).toBe(true);

    // /api/users (todos, activos e inactivos)
    const responseAll = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(responseAll.status).toBe(200);
    const hayInactivos = responseAll.body.some(
      (user) => user.isActive === false
    );
    expect(hayInactivos).toBe(true); // Debería incluir al usuario inactivo

    // Limpiar
    await tempInactiveUser.destroy();

    console.log("✅ Diferenciación correcta entre usuarios activos y todos");
  });
});
