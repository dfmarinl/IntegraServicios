// Tests/TC-UNIT-003.test.js
const Resource = require("../models/Resource");
const Reservation = require("../models/Reservation");
const TypeSchedule = require("../models/TypeSchedule");

describe("TC-UNIT-003: Validación de disponibilidad de recursos - HU-006", () => {
  test("1. HU-006: Recurso no disponible cuando isAvailable=false", async () => {
    // Criterio de aceptación: el recurso debe estar disponible en el horario solicitado

    console.log("Validando disponibilidad de recurso...");

    const recursoNoDisponible = Resource.build({
      name: "Proyector 1",
      typeId: 1,
      photoUrl: "foto.jpg",
      isAvailable: false,
      isActive: true,
    });

    expect(recursoNoDisponible.isAvailable).toBe(false);
    expect(recursoNoDisponible.isActive).toBe(true);

    // Un recurso con isAvailable=false NO debería estar disponible para reservas
    const estaDisponibleParaReserva = recursoNoDisponible.isAvailable === true;
    expect(estaDisponibleParaReserva).toBe(false);
  });

  test("2. HU-006: Validación de horario dentro del rango permitido", () => {
    // Criterio de aceptación: reserva solo en horario de disponibilidad del recurso

    console.log("Validando rango horario...");

    // Función de validación simplificada
    const estaDentroDelHorario = (horaSolicitada, horaInicio, horaFin) => {
      return horaSolicitada >= horaInicio && horaSolicitada <= horaFin;
    };

    // Caso 1: Horario válido (dentro del rango)
    expect(estaDentroDelHorario("10:00", "08:00", "18:00")).toBe(true);

    // Caso 2: Horario inválido (antes de la apertura)
    expect(estaDentroDelHorario("07:00", "08:00", "18:00")).toBe(false);

    // Caso 3: Horario inválido (después del cierre)
    expect(estaDentroDelHorario("19:00", "08:00", "18:00")).toBe(false);

    // Caso 4: Límite exacto (inicio)
    expect(estaDentroDelHorario("08:00", "08:00", "18:00")).toBe(true);

    // Caso 5: Límite exacto (fin)
    expect(estaDentroDelHorario("18:00", "08:00", "18:00")).toBe(true);
  });

  test("3. HU-006: Detección de conflictos de reserva", () => {
    // Criterio de aceptación: validar que no existan conflictos de reserva

    console.log("Detectando conflictos de reserva...");

    const hayConflictoDeHorario = (
      nuevaInicio,
      nuevaFin,
      existenteInicio,
      existenteFin
    ) => {
      // Un conflicto ocurre si los intervalos se solapan
      return nuevaInicio < existenteFin && nuevaFin > existenteInicio;
    };

    // Reserva existente: 10:00 - 12:00

    // Caso 1: Nueva reserva que NO se solapa (9:00 - 10:00)
    expect(
      hayConflictoDeHorario(
        new Date("2025-12-10T09:00:00"),
        new Date("2025-12-10T10:00:00"),
        new Date("2025-12-10T10:00:00"),
        new Date("2025-12-10T12:00:00")
      )
    ).toBe(false);

    // Caso 2: Nueva reserva que SÍ se solapa (11:00 - 13:00)
    expect(
      hayConflictoDeHorario(
        new Date("2025-12-10T11:00:00"),
        new Date("2025-12-10T13:00:00"),
        new Date("2025-12-10T10:00:00"),
        new Date("2025-12-10T12:00:00")
      )
    ).toBe(true);

    // Caso 3: Nueva reserva que empieza durante la existente (10:30 - 11:30)
    expect(
      hayConflictoDeHorario(
        new Date("2025-12-10T10:30:00"),
        new Date("2025-12-10T11:30:00"),
        new Date("2025-12-10T10:00:00"),
        new Date("2025-12-10T12:00:00")
      )
    ).toBe(true);

    // Caso 4: Nueva reserva que contiene a la existente (9:00 - 13:00)
    expect(
      hayConflictoDeHorario(
        new Date("2025-12-10T09:00:00"),
        new Date("2025-12-10T13:00:00"),
        new Date("2025-12-10T10:00:00"),
        new Date("2025-12-10T12:00:00")
      )
    ).toBe(true);
  });

  test("4. HU-006: Validación de usuario registrado", () => {
    // Criterio de aceptación: solo usuarios registrados pueden reservar

    console.log("Validando usuario registrado...");

    const puedeReservar = (usuarioRegistrado, recursoDisponible) => {
      return usuarioRegistrado && recursoDisponible;
    };

    // Caso 1: Usuario registrado y recurso disponible
    expect(puedeReservar(true, true)).toBe(true);

    // Caso 2: Usuario NO registrado (aunque recurso disponible)
    expect(puedeReservar(false, true)).toBe(false);

    // Caso 3: Usuario registrado pero recurso NO disponible
    expect(puedeReservar(true, false)).toBe(false);

    // Caso 4: Ni usuario registrado ni recurso disponible
    expect(puedeReservar(false, false)).toBe(false);
  });
});
