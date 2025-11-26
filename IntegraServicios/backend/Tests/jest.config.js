// tests/setup.js
const { sequelize } = require("../models");

// Configuración global antes de todas las pruebas
beforeAll(async () => {
  // Opcional: Configuraciones globales
  console.log("Iniciando configuración global de pruebas...");
});

// Limpieza global después de todas las pruebas
afterAll(async () => {
  await sequelize.close();
});

// Configuración de timeout para Jest
jest.setTimeout(30000);
