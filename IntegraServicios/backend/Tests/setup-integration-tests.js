// Tests/setup-integration.js - VERSIÓN ACTUALIZADA
const { Sequelize } = require("sequelize");

// 1. Configurar base de datos de prueba
const testSequelize = new Sequelize({
  dialect: "sqlite",
  storage: ":memory:",
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

// 2. Mock de la base de datos original
jest.mock("../config/database", () => ({
  __esModule: true,
  default: testSequelize,
  ...testSequelize,
}));

// 3. MOCK DEL MIDDLEWARE DE AUTENTICACIÓN - ¡ESTO ES LO QUE FALTA!
jest.mock("../middleware/authentication", () => ({
  verifyToken: jest.fn((req, res, next) => {
    // Por defecto, usa estudiante
    req.user = global.testUser || {
      id: 1,
      rol: "estudiante",
      email: "estudiante@test.com",
    };
    next();
  }),

  authorizeRoles: jest.fn((...roles) => {
    return (req, res, next) => {
      if (roles.includes(req.user.rol)) {
        next();
      } else {
        res.status(403).json({ message: "Acceso denegado" });
      }
    };
  }),
}));

// 4. Configurar Jest
jest.setTimeout(30000);

// 5. Helpers globales
global.clearDatabase = async () => {
  const models = [
    require("../models/Reservation"),
    require("../models/Loan"),
    require("../models/Resource"),
    require("../models/user"),
    require("../models/ResourceType"),
    require("../models/Unit"),
  ];

  for (const model of models) {
    await model.destroy({ where: {}, truncate: { cascade: true } });
  }
};

// 6. Datos de prueba globales
global.testUser = null;
global.testEmployee = null;
global.testAdmin = null;

global.createTestData = async () => {
  const User = require("../models/user");
  const Unit = require("../models/Unit");
  const ResourceType = require("../models/ResourceType");
  const Resource = require("../models/Resource");

  const unit = await Unit.create({
    name: "test_unit",
    description: "Unidad de pruebas",
    granularity: 30,
    isActive: true,
  });

  const resourceType = await ResourceType.create({
    name: "test_type",
    unitId: unit.id,
    granularity: 30,
    isActive: true,
  });

  const resource = await Resource.create({
    name: "Recurso Prueba",
    photoUrl: "test.jpg",
    typeId: resourceType.id,
    isAvailable: true,
    isActive: true,
  });

  const student = await User.create({
    firstName: "Estudiante",
    lastName: "Test",
    identificationNumber: "1111111111",
    age: 20,
    email: "estudiante@test.com",
    city: "Test City",
    direction: "Test Address",
    password: "$2b$10$MockHashForTesting1234567890", // Hash falso
    rol: "estudiante",
  });

  const employee = await User.create({
    firstName: "Empleado",
    lastName: "Test",
    identificationNumber: "2222222222",
    age: 30,
    email: "empleado@test.com",
    city: "Test City",
    direction: "Test Address",
    password: "$2b$10$MockHashForTesting1234567890",
    rol: "empleado_unidad",
  });

  const admin = await User.create({
    firstName: "Admin",
    lastName: "Test",
    identificationNumber: "3333333333",
    age: 35,
    email: "admin@test.com",
    city: "Test City",
    direction: "Test Address",
    password: "$2b$10$MockHashForTesting1234567890",
    rol: "administrador",
  });

  // Guardar en variables globales
  global.testUser = {
    id: student.id,
    rol: student.rol,
    email: student.email,
  };

  global.testEmployee = {
    id: employee.id,
    rol: employee.rol,
    email: employee.email,
  };

  global.testAdmin = {
    id: admin.id,
    rol: admin.rol,
    email: admin.email,
  };

  return { unit, resourceType, resource, student, employee, admin };
};

// 7. Funciones helper para cambiar usuario en tests
global.setTestUser = (userType = "estudiante") => {
  const { verifyToken } = require("../middleware/authentication");

  if (userType === "empleado") {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = global.testEmployee;
      next();
    });
  } else if (userType === "administrador") {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = global.testAdmin;
      next();
    });
  } else {
    verifyToken.mockImplementation((req, res, next) => {
      req.user = global.testUser;
      next();
    });
  }
};
