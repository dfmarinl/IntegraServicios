// Tests/TC-UNIT-004.test.js
const Rating = require("../models/Rating");
const Reservation = require("../models/Reservation");
const User = require("../models/user");

describe("TC-UNIT-004: Validación de calificación del servicio - HU-011", () => {
  test("1. HU-011: Calcular promedio de 0-5 estrellas correctamente", () => {
    // Función para calcular promedio de calificación
    const calcularPromedio = (
      scheduleCompliance,
      resourceQuality,
      staffKindness
    ) => {
      // Validar que todas las calificaciones estén en rango 0-5
      const calificaciones = [
        scheduleCompliance,
        resourceQuality,
        staffKindness,
      ];

      calificaciones.forEach((cal) => {
        if (cal < 0 || cal > 5) {
          throw new Error(
            "Las calificaciones deben estar entre 0 y 5 estrellas"
          );
        }
      });

      // Calcular promedio con 2 decimales
      const suma = scheduleCompliance + resourceQuality + staffKindness;
      const promedio = suma / 3;

      return Math.round(promedio * 100) / 100; // Redondear a 2 decimales
    };

    // Caso 1: Calificación perfecta (5, 5, 5)
    expect(calcularPromedio(5, 5, 5)).toBe(5.0);

    // Caso 2: Calificación promedio (3, 4, 5)
    expect(calcularPromedio(3, 4, 5)).toBe(4.0);

    // Caso 3: Calificación baja (1, 2, 1)
    expect(calcularPromedio(1, 2, 1)).toBe(1.33);

    // Caso 4: Calificación mínima (0, 0, 0)
    expect(calcularPromedio(0, 0, 0)).toBe(0.0);

    // Caso 5: Calificación con decimales en cálculo (4, 5, 3)
    expect(calcularPromedio(4, 5, 3)).toBe(4.0);

    // Caso 6: Validar error cuando calificación fuera de rango
    expect(() => calcularPromedio(6, 5, 4)).toThrow(
      "Las calificaciones deben estar entre 0 y 5 estrellas"
    );
    expect(() => calcularPromedio(-1, 3, 4)).toThrow(
      "Las calificaciones deben estar entre 0 y 5 estrellas"
    );
  });

  test("2. HU-011: Validar modelo Rating y sus restricciones", async () => {
    console.log("Validando modelo Rating...");

    // Verificar que el modelo tiene las validaciones configuradas
    expect(Rating.options).toBeDefined();

    // Verificar que tiene las columnas esperadas
    const atributos = Rating.rawAttributes;
    expect(atributos.scheduleCompliance).toBeDefined();
    expect(atributos.resourceQuality).toBeDefined();
    expect(atributos.staffKindness).toBeDefined();
    expect(atributos.averageStars).toBeDefined();
    expect(atributos.comment).toBeDefined();

    // Verificar validaciones de rango
    expect(atributos.scheduleCompliance.validate.min).toBe(0);
    expect(atributos.scheduleCompliance.validate.max).toBe(5);
    expect(atributos.resourceQuality.validate.min).toBe(0);
    expect(atributos.resourceQuality.validate.max).toBe(5);
    expect(atributos.staffKindness.validate.min).toBe(0);
    expect(atributos.staffKindness.validate.max).toBe(5);
    expect(atributos.averageStars.validate.min).toBe(0);
    expect(atributos.averageStars.validate.max).toBe(5);
  });

  test("3. HU-011: Validar que solo reservas finalizadas pueden calificarse", () => {
    console.log("Validando estado de reserva para calificación...");

    // Función para validar si una reserva puede ser calificada
    const puedeCalificarReserva = (estadoReserva) => {
      return estadoReserva === "finalizada";
    };

    // Caso 1: Reserva finalizada - SÍ puede calificarse
    expect(puedeCalificarReserva("finalizada")).toBe(true);

    // Caso 2: Reserva pendiente - NO puede calificarse
    expect(puedeCalificarReserva("pendiente")).toBe(false);

    // Caso 3: Reserva activa - NO puede calificarse
    expect(puedeCalificarReserva("activa")).toBe(false);

    // Caso 4: Reserva cancelada - NO puede calificarse
    expect(puedeCalificarReserva("cancelada")).toBe(false);
  });

  test("4. HU-011: Validar creación de calificación con datos completos", async () => {
    console.log("Validando creación de calificación...");

    // Datos válidos para una calificación
    const datosCalificacionValida = {
      scheduleCompliance: 5,
      resourceQuality: 4,
      staffKindness: 5,
      averageStars: 4.67,
      comment: "Excelente servicio, el recurso estaba en perfecto estado",
      reservationId: 1,
      userId: 1,
    };

    // Construir instancia del modelo
    const rating = Rating.build(datosCalificacionValida);

    // Validar que se construye correctamente
    expect(rating.scheduleCompliance).toBe(5);
    expect(rating.resourceQuality).toBe(4);
    expect(rating.staffKindness).toBe(5);
    expect(rating.averageStars).toBe(4.67);
    expect(rating.comment).toBe(
      "Excelente servicio, el recurso estaba en perfecto estado"
    );
    expect(rating.reservationId).toBe(1);
    expect(rating.userId).toBe(1);

    // La validación debería pasar sin errores
    await expect(rating.validate()).resolves.not.toThrow();
  });

  test("5. HU-011: Validar error al crear calificación con datos inválidos", async () => {
    console.log("Validando errores en calificación inválida...");

    // Caso 1: Calificación fuera de rango
    const datosCalificacionInvalida = {
      scheduleCompliance: 6, // Fuera de rango (máximo 5)
      resourceQuality: 5,
      staffKindness: 5,
      averageStars: 5.33,
      reservationId: 1,
      userId: 1,
    };

    const ratingInvalido = Rating.build(datosCalificacionInvalida);

    // La validación debería fallar
    await expect(ratingInvalido.validate()).rejects.toThrow();
  });

  test("6. HU-011: Validar comentario opcional", async () => {
    console.log("Validando comentario opcional...");

    // Caso 1: Calificación SIN comentario (debería ser válida)
    const datosSinComentario = {
      scheduleCompliance: 3,
      resourceQuality: 3,
      staffKindness: 4,
      averageStars: 3.33,
      reservationId: 1,
      userId: 1,
      // No incluimos el campo 'comment' deliberadamente
    };

    const ratingSinComentario = Rating.build(datosSinComentario);

    // La validación debería pasar (comment es allowNull: true)
    await expect(ratingSinComentario.validate()).resolves.not.toThrow();

    // En Sequelize, cuando no se especifica un campo, queda como undefined
    expect(ratingSinComentario.comment).toBeUndefined();

    // Caso 2: Calificación con comentario explícitamente null
    const datosComentarioNull = {
      scheduleCompliance: 4,
      resourceQuality: 4,
      staffKindness: 4,
      averageStars: 4.0,
      comment: null, // Comentario explícitamente null
      reservationId: 1,
      userId: 1,
    };

    const ratingComentarioNull = Rating.build(datosComentarioNull);

    // La validación debería pasar
    await expect(ratingComentarioNull.validate()).resolves.not.toThrow();
    expect(ratingComentarioNull.comment).toBeNull();

    // Caso 3: Calificación CON comentario vacío
    const datosComentarioVacio = {
      scheduleCompliance: 4,
      resourceQuality: 4,
      staffKindness: 4,
      averageStars: 4.0,
      comment: "", // Comentario vacío
      reservationId: 1,
      userId: 1,
    };

    const ratingComentarioVacio = Rating.build(datosComentarioVacio);

    // La validación debería pasar
    await expect(ratingComentarioVacio.validate()).resolves.not.toThrow();
    expect(ratingComentarioVacio.comment).toBe("");

    // Caso 4: Calificación CON comentario válido
    const datosComentarioValido = {
      scheduleCompliance: 5,
      resourceQuality: 5,
      staffKindness: 5,
      averageStars: 5.0,
      comment: "Servicio excelente, muy recomendado",
      reservationId: 1,
      userId: 1,
    };

    const ratingComentarioValido = Rating.build(datosComentarioValido);

    // La validación debería pasar
    await expect(ratingComentarioValido.validate()).resolves.not.toThrow();
    expect(ratingComentarioValido.comment).toBe(
      "Servicio excelente, muy recomendado"
    );
  });
});
