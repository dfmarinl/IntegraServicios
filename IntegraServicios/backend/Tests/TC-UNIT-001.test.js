// Tests/TC-UNIT-001.test.js
const UnitSchedule = require("../models/UnitSchedule");
const TypeSchedule = require("../models/TypeSchedule");

describe("TC-UNIT-001: Validación de rangos horarios - HU-001", () => {
  test("Modelo UnitSchedule valida startTime < endTime", async () => {
    const scheduleData = {
      unitId: 1,
      dayOfWeek: "lunes",
      startTime: "23:00:00",
      endTime: "06:00:00",
    };

    // Usar try-catch para capturar el error de validación
    let validationError = null;
    try {
      const schedule = UnitSchedule.build(scheduleData);
      await schedule.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).not.toBeNull();
    expect(validationError.name).toBe("SequelizeValidationError");
    expect(validationError.errors[0].message).toBe(
      "startTime debe ser menor que endTime"
    );
  });

  test("Modelo TypeSchedule valida startTime < endTime", async () => {
    const scheduleData = {
      typeId: 1,
      dayOfWeek: "lunes",
      startTime: "23:00:00",
      endTime: "06:00:00",
    };

    let validationError = null;
    try {
      const schedule = TypeSchedule.build(scheduleData);
      await schedule.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).not.toBeNull();
    expect(validationError.name).toBe("SequelizeValidationError");
    expect(validationError.errors[0].message).toBe(
      "startTime debe ser menor que endTime"
    );
  });

  test("Validación de horario global 06:00-23:00 debería pasar", async () => {
    const validSchedule = {
      unitId: 1,
      dayOfWeek: "lunes",
      startTime: "06:00:00",
      endTime: "23:00:00",
    };

    let validationError = null;
    try {
      const schedule = UnitSchedule.build(validSchedule);
      await schedule.validate();
    } catch (error) {
      validationError = error;
    }

    expect(validationError).toBeNull();
  });
});
