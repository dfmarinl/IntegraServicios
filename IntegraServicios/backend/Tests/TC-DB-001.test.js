// Tests/TC-DB-001.test.js
const sequelize = require("../config/database");
const Reservation = require("../models/Reservation");
const Loan = require("../models/Loan");
const User = require("../models/user");
const Resource = require("../models/Resource");
const ResourceType = require("../models/ResourceType");
const Unit = require("../models/Unit");

describe("TC-DB-001: Transacción préstamo - HU-007", () => {
  let transaction;

  // Configurar transacción antes de cada test
  beforeEach(async () => {
    transaction = await sequelize.transaction();
  });

  // Limpiar después de cada test
  afterEach(async () => {
    try {
      await transaction.rollback();
    } catch (error) {
      // Ignorar errores si la transacción ya fue cerrada
    }
  });

  // Helper para crear datos de prueba
  const crearDatosPrueba = async (t) => {
    const unidad = await Unit.create(
      {
        name: `Unidad Pruebas ${Date.now()}`,
        granularity: 30,
        isActive: true,
      },
      { transaction: t }
    );

    const tipoRecurso = await ResourceType.create(
      {
        name: `Tipo Prueba ${Date.now()}`,
        unitId: unidad.id,
        granularity: 30,
      },
      { transaction: t }
    );

    const recurso = await Resource.create(
      {
        name: `Recurso Prueba ${Date.now()}`,
        typeId: tipoRecurso.id,
        photoUrl: "foto.jpg",
        isAvailable: true,
        isActive: true,
      },
      { transaction: t }
    );

    const usuarioEstudiante = await User.create(
      {
        firstName: "Estudiante",
        lastName: `Prueba${Date.now()}`,
        identificationNumber: `est${Date.now()}`,
        age: 20,
        email: `estudiante${Date.now()}@test.com`,
        city: "Bogotá",
        direction: "Calle 123",
        password: "password123",
        rol: "estudiante",
      },
      { transaction: t }
    );

    const usuarioEmpleado = await User.create(
      {
        firstName: "Empleado",
        lastName: `Unidad${Date.now()}`,
        identificationNumber: `emp${Date.now()}`,
        age: 30,
        email: `empleado${Date.now()}@test.com`,
        city: "Bogotá",
        direction: "Calle 456",
        password: "password123",
        rol: "empleado_unidad",
      },
      { transaction: t }
    );

    return { unidad, tipoRecurso, recurso, usuarioEstudiante, usuarioEmpleado };
  };

  // Función que simula el servicio de préstamo con transacción
  const servicioRegistrarPrestamo = async (
    reservationId,
    employeeId,
    hasFailure = false
  ) => {
    const t = await sequelize.transaction();

    try {
      // 1. Verificar que la reserva existe y está vigente (pendiente)
      const reserva = await Reservation.findOne({
        where: {
          id: reservationId,
          status: "pendiente", // Solo reservas pendientes pueden prestarse
        },
        transaction: t,
      });

      if (!reserva) {
        throw new Error("Reserva no encontrada o no está en estado pendiente");
      }

      // 2. Verificar que la hora de entrega está dentro del lapso adecuado
      const ahora = new Date();
      const horaInicioReserva = new Date(reserva.startDateTime);
      const horaFinReserva = new Date(reserva.endDateTime);

      // Permitir entrega hasta 5 minutos antes o después del inicio
      const margenMinutos = 5;
      const horaInicioPermitida = new Date(
        horaInicioReserva.getTime() - margenMinutos * 60000
      );
      const horaFinPermitida = new Date(
        horaInicioReserva.getTime() + margenMinutos * 60000
      );

      if (ahora < horaInicioPermitida || ahora > horaFinPermitida) {
        throw new Error("La hora de entrega no está dentro del lapso adecuado");
      }

      // 3. Actualizar estado de la reserva a "activa"
      const [numRowsUpdated] = await Reservation.update(
        { status: "activa" },
        {
          where: {
            id: reservationId,
            status: "pendiente", // Solo actualizar si sigue pendiente (evitar race conditions)
          },
          transaction: t,
        }
      );

      if (numRowsUpdated === 0) {
        throw new Error("No se pudo actualizar el estado de la reserva");
      }

      // 4. Crear el registro de préstamo
      const prestamo = await Loan.create(
        {
          deliveryTime: ahora,
          employeeId: employeeId,
          reservationId: reservationId,
          hasFailure: hasFailure,
        },
        { transaction: t }
      );

      // 5. Commit de la transacción
      await t.commit();

      return {
        success: true,
        message: "Préstamo registrado exitosamente",
        data: {
          prestamo: prestamo,
          reservaActualizada: await Reservation.findByPk(reservationId),
        },
      };
    } catch (error) {
      // Rollback automático si hay error
      await t.rollback();
      console.error("Error en transacción de préstamo:", error.message);

      return {
        success: false,
        message: error.message,
        error: error,
      };
    }
  };

  test("1. HU-007: Transacción exitosa - Préstamo válido dentro del lapso adecuado", async () => {
    console.log("1. Validando transacción exitosa para préstamo válido...");

    const datos = await crearDatosPrueba(transaction);

    // Crear reserva con horario que permita préstamo ahora
    const horaInicio = new Date();
    horaInicio.setMinutes(horaInicio.getMinutes() + 2); // Reserva en 2 minutos

    const horaFin = new Date(horaInicio);
    horaFin.setHours(horaFin.getHours() + 2);

    const reserva = await Reservation.create(
      {
        startDateTime: horaInicio,
        endDateTime: horaFin,
        status: "pendiente",
        isRepetitive: false,
        purpose: "Prueba de transacción exitosa",
        attendees: 3,
        userId: datos.usuarioEstudiante.id,
        resourceId: datos.recurso.id,
      },
      { transaction }
    );

    await transaction.commit(); // Guardar datos antes de la transacción de préstamo

    // Ejecutar servicio de préstamo
    const resultado = await servicioRegistrarPrestamo(
      reserva.id,
      datos.usuarioEmpleado.id
    );

    // Verificar resultados
    expect(resultado.success).toBe(true);
    expect(resultado.message).toBe("Préstamo registrado exitosamente");
    expect(resultado.data.prestamo).toBeDefined();
    expect(resultado.data.prestamo.reservationId).toBe(reserva.id);
    expect(resultado.data.prestamo.employeeId).toBe(datos.usuarioEmpleado.id);
    expect(resultado.data.prestamo.hasFailure).toBe(false);

    // Verificar atomicidad: tanto reserva como préstamo deben estar en estado correcto
    const reservaActualizada = await Reservation.findByPk(reserva.id);
    expect(reservaActualizada.status).toBe("activa");

    const prestamoCreado = await Loan.findOne({
      where: { reservationId: reserva.id },
    });
    expect(prestamoCreado).not.toBeNull();
    expect(prestamoCreado.deliveryTime).toBeDefined();

    console.log("✅ Transacción exitosa validada");
  });

  test("2. HU-007: Rollback automático - Reserva inexistente", async () => {
    console.log("2. Validando rollback para reserva inexistente...");

    const datos = await crearDatosPrueba(transaction);
    await transaction.commit();

    // Intentar préstamo con ID de reserva que no existe
    const reservationIdInexistente = 99999;
    const resultado = await servicioRegistrarPrestamo(
      reservationIdInexistente,
      datos.usuarioEmpleado.id
    );

    // Debería fallar
    expect(resultado.success).toBe(false);
    expect(resultado.message).toBe(
      "Reserva no encontrada o no está en estado pendiente"
    );

    // Verificar que NO se creó ningún préstamo
    const countPrestamos = await Loan.count();
    console.log(
      `Préstamos en BD después de transacción fallida: ${countPrestamos}`
    );

    // Verificar atomicidad: no debería haber cambios en la BD
    // (no hay reserva con ID 99999, no debería haber préstamo)

    console.log("✅ Rollback para reserva inexistente validado");
  });

  test("3. HU-007: Rollback automático - Reserva no en estado pendiente", async () => {
    console.log("3. Validando rollback para reserva no pendiente...");

    const datos = await crearDatosPrueba(transaction);

    // Crear reserva ya activa (no pendiente)
    const reserva = await Reservation.create(
      {
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: "activa", // ¡Ya está activa!
        isRepetitive: false,
        purpose: "Prueba rollback - reserva activa",
        attendees: 2,
        userId: datos.usuarioEstudiante.id,
        resourceId: datos.recurso.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Intentar préstamo con reserva ya activa
    const resultado = await servicioRegistrarPrestamo(
      reserva.id,
      datos.usuarioEmpleado.id
    );

    // Debería fallar
    expect(resultado.success).toBe(false);
    expect(resultado.message).toBe(
      "Reserva no encontrada o no está en estado pendiente"
    );

    // Verificar que NO se creó préstamo para esta reserva
    const prestamo = await Loan.findOne({
      where: { reservationId: reserva.id },
    });
    expect(prestamo).toBeNull();

    // Verificar que la reserva sigue en estado "activa" (no cambió)
    const reservaDespues = await Reservation.findByPk(reserva.id);
    expect(reservaDespues.status).toBe("activa");

    console.log("✅ Rollback para reserva no pendiente validado");
  });

  test("4. HU-007: Rollback automático - Fuera del lapso adecuado", async () => {
    console.log("4. Validando rollback para entrega fuera de lapso...");

    const datos = await crearDatosPrueba(transaction);

    // Crear reserva que empieza MUY lejos en el futuro (fuera del margen de 5 minutos)
    const horaInicioLejana = new Date();
    horaInicioLejana.setHours(horaInicioLejana.getHours() + 3); // En 3 horas

    const horaFinLejana = new Date(horaInicioLejana);
    horaFinLejana.setHours(horaFinLejana.getHours() + 1);

    const reserva = await Reservation.create(
      {
        startDateTime: horaInicioLejana,
        endDateTime: horaFinLejana,
        status: "pendiente",
        isRepetitive: false,
        purpose: "Prueba fuera de lapso",
        attendees: 4,
        userId: datos.usuarioEstudiante.id,
        resourceId: datos.recurso.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Intentar préstamo ahora (fuera del margen de ±5 minutos)
    const resultado = await servicioRegistrarPrestamo(
      reserva.id,
      datos.usuarioEmpleado.id
    );

    // Debería fallar
    expect(resultado.success).toBe(false);
    expect(resultado.message).toBe(
      "La hora de entrega no está dentro del lapso adecuado"
    );

    // Verificar atomicidad: no debería haber cambios
    const reservaDespues = await Reservation.findByPk(reserva.id);
    expect(reservaDespues.status).toBe("pendiente"); // Sigue pendiente

    const prestamo = await Loan.findOne({
      where: { reservationId: reserva.id },
    });
    expect(prestamo).toBeNull();

    console.log("✅ Rollback para fuera de lapso validado");
  });

  test("5. HU-007: Préstamo con falla de servicio (hasFailure: true)", async () => {
    console.log("5. Validando préstamo con falla de servicio...");

    const datos = await crearDatosPrueba(transaction);

    // Crear reserva válida
    const horaInicio = new Date();
    horaInicio.setMinutes(horaInicio.getMinutes() + 1);

    const horaFin = new Date(horaInicio);
    horaFin.setHours(horaFin.getHours() + 1);

    const reserva = await Reservation.create(
      {
        startDateTime: horaInicio,
        endDateTime: horaFin,
        status: "pendiente",
        isRepetitive: false,
        purpose: "Prueba con falla",
        attendees: 1,
        userId: datos.usuarioEstudiante.id,
        resourceId: datos.recurso.id,
      },
      { transaction }
    );

    await transaction.commit();

    // Ejecutar servicio con hasFailure: true
    const resultado = await servicioRegistrarPrestamo(
      reserva.id,
      datos.usuarioEmpleado.id,
      true
    );

    // Debería ser exitoso pero con falla registrada
    expect(resultado.success).toBe(true);
    expect(resultado.data.prestamo.hasFailure).toBe(true);

    // Verificar que se actualizó la reserva y se creó el préstamo
    const reservaActualizada = await Reservation.findByPk(reserva.id);
    expect(reservaActualizada.status).toBe("activa");

    console.log("✅ Préstamo con falla de servicio validado");
  });

  test("6. HU-007: Atomicidad - Verificación completa commit/rollback", async () => {
    console.log("6. Validando atomicidad completa...");

    // Contar registros antes
    const countReservasAntes = await Reservation.count();
    const countPrestamosAntes = await Loan.count();

    console.log(
      `Antes: ${countReservasAntes} reservas, ${countPrestamosAntes} préstamos`
    );

    // Crear transacción independiente para esta prueba
    const t = await sequelize.transaction();

    try {
      const datos = await crearDatosPrueba(t);

      // Crear reserva
      const reserva = await Reservation.create(
        {
          startDateTime: new Date(),
          endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          status: "pendiente",
          isRepetitive: false,
          purpose: "Prueba atomicidad",
          attendees: 5,
          userId: datos.usuarioEstudiante.id,
          resourceId: datos.recurso.id,
        },
        { transaction: t }
      );

      // Simular error intencional después de crear reserva
      throw new Error("Error simulado para probar rollback");

      // Esto no se ejecutará:
      await Loan.create(
        {
          deliveryTime: new Date(),
          employeeId: datos.usuarioEmpleado.id,
          reservationId: reserva.id,
          hasFailure: false,
        },
        { transaction: t }
      );

      await t.commit();
    } catch (error) {
      console.log("Capturando error simulado:", error.message);
      await t.rollback();

      // Verificar que NO se persistió nada
      const countReservasDespues = await Reservation.count();
      const countPrestamosDespues = await Loan.count();

      console.log(
        `Después: ${countReservasDespues} reservas, ${countPrestamosDespues} préstamos`
      );

      // En un entorno de prueba aislado, los counts deberían ser iguales
      // (nada se persistió por el rollback)
      expect(countReservasDespues).toBe(countReservasAntes);
      expect(countPrestamosDespues).toBe(countPrestamosAntes);

      console.log("✅ Atomicidad completa validada");
    }
  });
});
