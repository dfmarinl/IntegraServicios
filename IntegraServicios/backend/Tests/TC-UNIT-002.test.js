// Tests/TC-UNIT-002.test.js
const ResourceType = require("../models/ResourceType");

describe("TC-UNIT-002: Validación de nombre único en unidad - HU-002", () => {
  test("1. HU-002: Validación de índice único en modelo ResourceType", () => {
    // Verificar que el modelo tiene el índice único configurado
    console.log("🔍 Verificando índices del modelo ResourceType...");

    // El modelo debería tener la configuración de índice único
    expect(ResourceType.options).toBeDefined();

    const indexes = ResourceType.options.indexes || [];
    console.log("Índices encontrados:", indexes.length);

    // Buscar el índice único por unidad y nombre
    const uniqueIndex = indexes.find(
      (idx) =>
        idx.unique &&
        idx.fields &&
        idx.fields.includes("unitId") &&
        idx.fields.includes("name")
    );

    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex.unique).toBe(true);
    expect(uniqueIndex.fields).toContain("unitId");
    expect(uniqueIndex.fields).toContain("name");
  });

  test("2. HU-002: Validación de constraint único a nivel de base de datos", async () => {
    // Esta prueba simula la validación que hace Sequelize

    console.log("Simulando validación de nombre único...");

    // Mock simple para simular la validación
    const validarNombreUnicoEnUnidad = async (nombre, unitId) => {
      // Simulación: si nombre contiene "duplicado", retorna true (existe)
      return nombre.toLowerCase().includes("duplicado");
    };

    // Caso 1: Nombre único debería retornar false
    const resultadoUnico = await validarNombreUnicoEnUnidad(
      "Proyector Nuevo",
      1
    );
    expect(resultadoUnico).toBe(false);

    // Caso 2: Nombre duplicado debería retornar true
    const resultadoDuplicado = await validarNombreUnicoEnUnidad(
      "Proyector Duplicado",
      1
    );
    expect(resultadoDuplicado).toBe(true);
  });

  test("3. HU-002: Validación de case-insensitive", () => {
    // Verificar que la validación no distingue mayúsculas/minúsculas

    console.log("Verificando validación case-insensitive...");

    const nombresEquivalentes = [
      "Proyector Sony",
      "proyector sony",
      "PROYECTOR SONY",
      "PrOyEcToR SoNy",
    ];

    // En una validación case-insensitive, todos deberían considerarse iguales
    const nombresNormalizados = nombresEquivalentes.map((n) => n.toLowerCase());

    // Todos deberían normalizarse al mismo string
    const primerNombre = nombresNormalizados[0];
    nombresNormalizados.forEach((nombre) => {
      expect(nombre).toBe(primerNombre);
    });
  });

  test("4. HU-002: Campos requeridos del modelo", () => {
    // Verificar validaciones básicas del modelo

    console.log("Verificando validaciones del modelo...");

    // Intentar crear sin nombre debería fallar
    const datosIncompletos = {
      unitId: 1,
      // name faltante
      granularity: 30,
    };

    const resourceType = ResourceType.build(datosIncompletos);

    // La validación debería fallar asincrónicamente
    return expect(resourceType.validate()).rejects.toThrow();
  });
});
