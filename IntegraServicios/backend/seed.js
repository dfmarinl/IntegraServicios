const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const DATABASE_URL =
  "postgresql://neondb_owner:npg_7HKojtZeygD0@ep-royal-flower-awjze0xx-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  logging: false,
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

// ============================================
// MODELOS
// ============================================

const Unit = sequelize.define("Unit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  granularity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  identificationNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  age: { type: DataTypes.INTEGER, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  city: { type: DataTypes.STRING, allowNull: false },
  direction: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  rol: {
    type: DataTypes.ENUM("estudiante","docente","personal_administrativo","empleado_unidad","administrador"),
    allowNull: false,
    defaultValue: "estudiante",
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  unitId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
});

const ResourceType = sequelize.define("ResourceType", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  granularity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 30 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Resource = sequelize.define("Resource", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  photoUrl: { type: DataTypes.STRING, allowNull: false },
  features: { type: DataTypes.JSON, allowNull: true },
  isAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const UnitSchedule = sequelize.define("UnitSchedule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  unitId: { type: DataTypes.INTEGER, allowNull: false },
  dayOfWeek: {
    type: DataTypes.ENUM("lunes","martes","miercoles","jueves","viernes","sabado","domingo"),
    allowNull: false,
  },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const TypeSchedule = sequelize.define("TypeSchedule", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  typeId: { type: DataTypes.INTEGER, allowNull: false },
  dayOfWeek: {
    type: DataTypes.ENUM("lunes","martes","miercoles","jueves","viernes","sabado","domingo"),
    allowNull: false,
  },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

const Reservation = sequelize.define("Reservation", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  startDateTime: { type: DataTypes.DATE, allowNull: false },
  endDateTime: { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.ENUM("pendiente","activa","finalizada","cancelada"),
    defaultValue: "pendiente",
  },
  isRepetitive: { type: DataTypes.BOOLEAN, defaultValue: false },
  purpose: { type: DataTypes.TEXT, allowNull: false, defaultValue: "Uso del recurso" },
  attendees: { type: DataTypes.INTEGER, defaultValue: 1 },
});

const Loan = sequelize.define("Loan", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  deliveryTime: { type: DataTypes.DATE, allowNull: false },
  employeeId: { type: DataTypes.INTEGER, allowNull: false },
  hasFailure: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Return = sequelize.define("Return", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  returnTime: { type: DataTypes.DATE, allowNull: false },
  hasFailure: { type: DataTypes.BOOLEAN, defaultValue: false },
  hasDamage: { type: DataTypes.BOOLEAN, defaultValue: false },
  loanId: { type: DataTypes.INTEGER, allowNull: false },
  employeeId: { type: DataTypes.INTEGER, allowNull: false },
});

const Rating = sequelize.define("Rating", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  scheduleCompliance: { type: DataTypes.INTEGER, allowNull: false },
  resourceQuality: { type: DataTypes.INTEGER, allowNull: false },
  staffKindness: { type: DataTypes.INTEGER, allowNull: false },
  averageStars: { type: DataTypes.DECIMAL(3, 2), allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: true },
});

const Failure = sequelize.define("Failure", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM("pendiente","resuelto"), defaultValue: "pendiente" },
  loanId: { type: DataTypes.INTEGER, allowNull: false },
});

const Sanction = sequelize.define("Sanction", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reason: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
});

const UserUnit = sequelize.define("UserUnit", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role: {
    type: DataTypes.ENUM("administrador_unidad","coordinador","auxiliar","tecnico","vigilante"),
    allowNull: false,
    defaultValue: "auxiliar",
  },
  assignedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  unitId: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: "user_units" });

// ============================================
// ASOCIACIONES
// ============================================

Unit.hasMany(ResourceType, { foreignKey: "unitId", onDelete: "CASCADE" });
ResourceType.belongsTo(Unit, { foreignKey: "unitId" });

Unit.hasMany(UnitSchedule, { foreignKey: "unitId", onDelete: "CASCADE" });
UnitSchedule.belongsTo(Unit, { foreignKey: "unitId" });

ResourceType.hasMany(Resource, { foreignKey: "typeId", onDelete: "CASCADE" });
Resource.belongsTo(ResourceType, { foreignKey: "typeId" });

ResourceType.hasMany(TypeSchedule, { foreignKey: "typeId", onDelete: "CASCADE" });
TypeSchedule.belongsTo(ResourceType, { foreignKey: "typeId" });

User.hasMany(Reservation, { foreignKey: "userId", onDelete: "CASCADE" });
Reservation.belongsTo(User, { foreignKey: "userId" });

Resource.hasMany(Reservation, { foreignKey: "resourceId", onDelete: "CASCADE" });
Reservation.belongsTo(Resource, { foreignKey: "resourceId" });

Reservation.hasOne(Loan, { foreignKey: "reservationId", onDelete: "CASCADE" });
Loan.belongsTo(Reservation, { foreignKey: "reservationId" });

Reservation.hasOne(Rating, { foreignKey: "reservationId", onDelete: "CASCADE" });
Rating.belongsTo(Reservation, { foreignKey: "reservationId" });

Loan.hasOne(Return, { foreignKey: "loanId", onDelete: "CASCADE" });
Return.belongsTo(Loan, { foreignKey: "loanId" });

Loan.hasMany(Failure, { foreignKey: "loanId", onDelete: "CASCADE" });
Failure.belongsTo(Loan, { foreignKey: "loanId" });

User.hasMany(Loan, { foreignKey: "employeeId", as: "LoansManaged" });
Loan.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

User.hasMany(Return, { foreignKey: "employeeId", as: "ReturnsManaged" });
Return.belongsTo(User, { foreignKey: "employeeId", as: "Employee" });

User.hasMany(Rating, { foreignKey: "userId", onDelete: "CASCADE" });
Rating.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Sanction, { foreignKey: "userId", onDelete: "CASCADE" });
Sanction.belongsTo(User, { foreignKey: "userId" });

// ============================================
// HELPERS
// ============================================

const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth();
const D = now.getDate();

function dateFromNow(days, h = 10, m = 0) {
  return new Date(Y, M, D + days, h, m, 0, 0);
}

function hash(pw) {
  return bcrypt.hashSync(pw, 10);
}

// ============================================
// SEED
// ============================================

async function seed() {
  console.log("Conectando a NeonDB...");
  await sequelize.authenticate();
  console.log("Conexion exitosa.");

  console.log("Sincronizando tablas (force: true)...");
  await sequelize.sync({ force: true });
  console.log("Tablas creadas.");

  // 1. UNIDADES
  console.log("1/13 Insertando unidades...");
  const units = await Unit.bulkCreate([
    { name: "integracion", description: "Unidad de Integracion y Desarrollo de Software", granularity: 30 },
    { name: "ciencias de la salud", description: "Facultad de Ciencias de la Salud", granularity: 30 },
    { name: "ingenieria", description: "Facultad de Ingenieria y Tecnologias", granularity: 30 },
  ]);
  const [uInt, uSalud, uIngen] = units;

  // 2. USUARIOS
  console.log("2/13 Insertando usuarios...");
  const pw = hash("password123");
  const users = await User.bulkCreate([
    { firstName: "Carlos", lastName: "Ramirez", identificationNumber: "1010101010", age: 45, email: "carlos.ramirez@universidad.edu", city: "Bogota", direction: "Calle 72 #10-25", password: pw, rol: "administrador" },
    { firstName: "Ana", lastName: "Martinez", identificationNumber: "1020202020", age: 34, email: "ana.martinez@universidad.edu", city: "Bogota", direction: "Carrera 15 #80-32", password: pw, rol: "empleado_unidad", unitId: uInt.id },
    { firstName: "Luis", lastName: "Herrera", identificationNumber: "1030303030", age: 29, email: "luis.herrera@universidad.edu", city: "Medellin", direction: "Calle 45 #67-12", password: pw, rol: "empleado_unidad", unitId: uSalud.id },
    { firstName: "Sandra", lastName: "Lopez", identificationNumber: "1040404040", age: 38, email: "sandra.lopez@universidad.edu", city: "Bogota", direction: "Avenida 68 #15-40", password: pw, rol: "docente" },
    { firstName: "Miguel", lastName: "Torres", identificationNumber: "1050505050", age: 42, email: "miguel.torres@universidad.edu", city: "Cali", direction: "Carrera 5 #23-67", password: pw, rol: "docente" },
    { firstName: "Maria", lastName: "Garcia", identificationNumber: "2010101010", age: 21, email: "maria.garcia@universidad.edu", city: "Bogota", direction: "Calle 26 #40-15", password: pw, rol: "estudiante" },
    { firstName: "Juan", lastName: "Perez", identificationNumber: "2020202020", age: 22, email: "juan.perez@universidad.edu", city: "Barranquilla", direction: "Carrera 7 #50-20", password: pw, rol: "estudiante" },
    { firstName: "Laura", lastName: "Sanchez", identificationNumber: "2030303030", age: 20, email: "laura.sanchez@universidad.edu", city: "Bogota", direction: "Calle 80 #12-34", password: pw, rol: "estudiante" },
    { firstName: "Andres", lastName: "Moreno", identificationNumber: "2040404040", age: 23, email: "andres.moreno@universidad.edu", city: "Bucaramanga", direction: "Avenida 27 #9-45", password: pw, rol: "estudiante" },
    { firstName: "Diana", lastName: "Rojas", identificationNumber: "1060606060", age: 31, email: "diana.rojas@universidad.edu", city: "Bogota", direction: "Carrera 30 #45-12", password: pw, rol: "personal_administrativo" },
    { firstName: "Felipe", lastName: "Castro", identificationNumber: "1070707070", age: 40, email: "felipe.castro@universidad.edu", city: "Bogota", direction: "Calle 100 #50-30", password: pw, rol: "administrador" },
  ]);
  const [admin, empInt, empSalud, doc1, doc2, est1, est2, est3, est4, persAdmin, admin2] = users;

  // 3. USER_UNITS
  console.log("3/13 Insertando asignaciones usuario-unidad...");
  await UserUnit.bulkCreate([
    { userId: empInt.id, unitId: uInt.id, role: "tecnico" },
    { userId: empSalud.id, unitId: uSalud.id, role: "auxiliar" },
    { userId: admin.id, unitId: uInt.id, role: "administrador_unidad" },
  ]);

  // 4. UNIT_SCHEDULES
  console.log("4/13 Insertando horarios de unidades...");
  const wk = ["lunes","martes","miercoles","jueves","viernes"];
  const usd = [];
  for (const unit of units) {
    for (const d of wk) usd.push({ unitId: unit.id, dayOfWeek: d, startTime: "07:00", endTime: "21:00" });
    usd.push({ unitId: unit.id, dayOfWeek: "sabado", startTime: "07:00", endTime: "14:00" });
    usd.push({ unitId: unit.id, dayOfWeek: "domingo", startTime: "08:00", endTime: "12:00", isActive: false });
  }
  await UnitSchedule.bulkCreate(usd);

  // 5. RESOURCE_TYPES
  console.log("5/13 Insertando tipos de recurso...");
  const rts = await ResourceType.bulkCreate([
    { name: "Salon de Clases", description: "Aulas equipadas para dictado de clases", granularity: 30, unitId: uInt.id },
    { name: "Sala de Computo", description: "Laboratorio con estaciones de trabajo en red", granularity: 60, unitId: uInt.id },
    { name: "Sala de Reunion", description: "Espacios para reuniones y trabajo en equipo", granularity: 30, unitId: uInt.id },
    { name: "Laboratorio Clinico", description: "Laboratorio para practicas de ciencias de la salud", granularity: 60, unitId: uSalud.id },
    { name: "Auditorio", description: "Espacio auditorio para eventos academicos", granularity: 60, unitId: uSalud.id },
    { name: "Salon Multifuncional", description: "Espacio versatil para actividades diversas", granularity: 30, unitId: uSalud.id },
    { name: "Lab de Sistemas", description: "Laboratorio de ingenieria de sistemas", granularity: 60, unitId: uIngen.id },
    { name: "Sala de Proyectos", description: "Espacios para desarrollo de proyectos", granularity: 30, unitId: uIngen.id },
    { name: "Aula Moderna", description: "Aulas con tecnologia interactiva", granularity: 30, unitId: uIngen.id },
  ]);
  const [tSalon, tComp, tReunion, tLab, tAud, tMulti, tLabSist, tProy, tAula] = rts;

  // 6. TYPE_SCHEDULES
  console.log("6/13 Insertando horarios por tipo...");
  const tsd = [];
  for (const t of rts) {
    for (const d of wk) tsd.push({ typeId: t.id, dayOfWeek: d, startTime: "08:00", endTime: "20:00" });
    tsd.push({ typeId: t.id, dayOfWeek: "sabado", startTime: "08:00", endTime: "13:00" });
  }
  await TypeSchedule.bulkCreate(tsd);

  // 7. RESOURCES
  console.log("7/13 Insertando recursos...");
  const res = await Resource.bulkCreate([
    { name: "Salon A1", photoUrl: "/images/salones/a1.jpg", features: { capacidad: 40, proyector: true, pizarra: true }, typeId: tSalon.id },
    { name: "Salon A2", photoUrl: "/images/salones/a2.jpg", features: { capacidad: 35, proyector: true, pizarra: true }, typeId: tSalon.id },
    { name: "Salon A3", photoUrl: "/images/salones/a3.jpg", features: { capacidad: 30, proyector: false, pizarra: true }, typeId: tSalon.id },
    { name: "Salon B1", photoUrl: "/images/salones/b1.jpg", features: { capacidad: 45, proyector: true, pizarra: true, aire: true }, typeId: tSalon.id },
    { name: "Salon B2", photoUrl: "/images/salones/b2.jpg", features: { capacidad: 25, proyector: false, pizarra: true }, typeId: tSalon.id },
    { name: "Lab PC-01", photoUrl: "/images/computo/pc01.jpg", features: { equipos: 30, internet: true, software: ["VS Code","Office"] }, typeId: tComp.id },
    { name: "Lab PC-02", photoUrl: "/images/computo/pc02.jpg", features: { equipos: 25, internet: true, software: ["Matlab","AutoCAD"] }, typeId: tComp.id },
    { name: "Lab PC-03", photoUrl: "/images/computo/pc03.jpg", features: { equipos: 20, internet: true, software: ["Adobe Suite"] }, typeId: tComp.id },
    { name: "Sala Jupiter", photoUrl: "/images/reunion/jupiter.jpg", features: { capacidad: 12, videoconferencia: true, pizarra: true }, typeId: tReunion.id },
    { name: "Sala Saturno", photoUrl: "/images/reunion/saturno.jpg", features: { capacidad: 8, videoconferencia: false, pizarra: true }, typeId: tReunion.id },
    { name: "Lab Quimica 1", photoUrl: "/images/lab/quimica1.jpg", features: { camas: 10, equipos_especializados: true, camaras: true }, typeId: tLab.id },
    { name: "Lab Quimica 2", photoUrl: "/images/lab/quimica2.jpg", features: { camas: 8, equipos_especializados: true }, typeId: tLab.id },
    { name: "Lab Fisica 1", photoUrl: "/images/lab/fisica1.jpg", features: { camas: 12, simuladores: true }, typeId: tLab.id },
    { name: "Auditorio Principal", photoUrl: "/images/auditorio/principal.jpg", features: { capacidad: 200, escenario: true, sonido: true }, typeId: tAud.id },
    { name: "Auditorio Norte", photoUrl: "/images/auditorio/norte.jpg", features: { capacidad: 100, proyector: true, sonido: true }, typeId: tAud.id },
    { name: "Multi A", photoUrl: "/images/multi/a.jpg", features: { capacidad: 50, mesas: true, sillas: true }, typeId: tMulti.id },
    { name: "Multi B", photoUrl: "/images/multi/b.jpg", features: { capacidad: 40, mesas: true, computadores: 10 }, typeId: tMulti.id },
    { name: "Lab Sistemas 1", photoUrl: "/images/labsist/1.jpg", features: { equipos: 35, internet: true, servidores: true }, typeId: tLabSist.id },
    { name: "Lab Sistemas 2", photoUrl: "/images/labsist/2.jpg", features: { equipos: 30, internet: true, red_local: true }, typeId: tLabSist.id },
    { name: "Proyecto Room 1", photoUrl: "/images/proyectos/room1.jpg", features: { capacidad: 10, pizarra: true, impresora_3d: true }, typeId: tProy.id },
    { name: "Proyecto Room 2", photoUrl: "/images/proyectos/room2.jpg", features: { capacidad: 8, pizarra: true, robotica: true }, typeId: tProy.id },
    { name: "Proyecto Room 3", photoUrl: "/images/proyectos/room3.jpg", features: { capacidad: 12, pizarra: true, proyector: true }, typeId: tProy.id },
    { name: "Aula Tech 1", photoUrl: "/images/aulas/tech1.jpg", features: { capacidad: 40, pantalla_interactiva: true, wifi: true }, typeId: tAula.id },
    { name: "Aula Tech 2", photoUrl: "/images/aulas/tech2.jpg", features: { capacidad: 35, pantalla_interactiva: true, bocinas: true }, typeId: tAula.id },
    { name: "Aula Tech 3", photoUrl: "/images/aulas/tech3.jpg", features: { capacidad: 30, proyector: true, wifi: true }, typeId: tAula.id },
  ]);

  // 8. RESERVATIONS
  console.log("8/13 Insertando reservas...");
  const rv = await Reservation.bulkCreate([
    // Finalizadas (0-7)
    { userId: est1.id, resourceId: res[0].id, startDateTime: dateFromNow(-14,8,0), endDateTime: dateFromNow(-14,10,0), status: "finalizada", purpose: "Clase de programacion", attendees: 25 },
    { userId: est2.id, resourceId: res[5].id, startDateTime: dateFromNow(-12,14,0), endDateTime: dateFromNow(-12,16,0), status: "finalizada", purpose: "Practica de laboratorio de software", attendees: 20 },
    { userId: doc1.id, resourceId: res[8].id, startDateTime: dateFromNow(-10,10,0), endDateTime: dateFromNow(-10,11,30), status: "finalizada", purpose: "Reunion de comision curricular", attendees: 8 },
    { userId: est3.id, resourceId: res[10].id, startDateTime: dateFromNow(-8,8,0), endDateTime: dateFromNow(-8,10,0), status: "finalizada", purpose: "Practica de quimica analitica", attendees: 15 },
    { userId: est4.id, resourceId: res[17].id, startDateTime: dateFromNow(-7,14,0), endDateTime: dateFromNow(-7,16,0), status: "finalizada", purpose: "Proyecto de base de datos", attendees: 10 },
    { userId: doc2.id, resourceId: res[13].id, startDateTime: dateFromNow(-5,9,0), endDateTime: dateFromNow(-5,11,0), status: "finalizada", purpose: "Conferencia de investigacion", attendees: 80 },
    { userId: est1.id, resourceId: res[20].id, startDateTime: dateFromNow(-4,15,0), endDateTime: dateFromNow(-4,17,0), status: "finalizada", purpose: "Desarrollo de prototipo IoT", attendees: 6 },
    { userId: persAdmin.id, resourceId: res[9].id, startDateTime: dateFromNow(-3,8,0), endDateTime: dateFromNow(-3,9,0), status: "finalizada", purpose: "Reunion de planificacion administrativa", attendees: 5 },
    // Activas (8-11)
    { userId: est2.id, resourceId: res[1].id, startDateTime: dateFromNow(-2,8,0), endDateTime: dateFromNow(-2,10,0), status: "activa", purpose: "Taller de algoritmos", attendees: 30, isRepetitive: true },
    { userId: doc1.id, resourceId: res[3].id, startDateTime: dateFromNow(-1,10,0), endDateTime: dateFromNow(-1,12,0), status: "activa", purpose: "Clase de estructuras de datos", attendees: 35 },
    { userId: est3.id, resourceId: res[17].id, startDateTime: dateFromNow(0,14,0), endDateTime: dateFromNow(0,16,0), status: "activa", purpose: "Proyecto de redes", attendees: 4 },
    { userId: est4.id, resourceId: res[23].id, startDateTime: dateFromNow(0,16,0), endDateTime: dateFromNow(0,18,0), status: "activa", purpose: "Estudio grupal de inteligencia artificial", attendees: 8 },
    // Pendientes (12-15)
    { userId: est1.id, resourceId: res[6].id, startDateTime: dateFromNow(1,8,0), endDateTime: dateFromNow(1,10,0), status: "pendiente", purpose: "Practica de AutoCAD", attendees: 20 },
    { userId: doc2.id, resourceId: res[4].id, startDateTime: dateFromNow(2,14,0), endDateTime: dateFromNow(2,16,0), status: "pendiente", purpose: "Clase de arquitectura de software", attendees: 28 },
    { userId: est3.id, resourceId: res[11].id, startDateTime: dateFromNow(3,9,0), endDateTime: dateFromNow(3,11,0), status: "pendiente", purpose: "Practica de anatomia", attendees: 12 },
    { userId: persAdmin.id, resourceId: res[8].id, startDateTime: dateFromNow(4,10,0), endDateTime: dateFromNow(4,11,0), status: "pendiente", purpose: "Junta directiva", attendees: 10 },
    // Canceladas (16-17)
    { userId: est2.id, resourceId: res[7].id, startDateTime: dateFromNow(-6,8,0), endDateTime: dateFromNow(-6,10,0), status: "cancelada", purpose: "Curso de Adobe Photoshop", attendees: 20 },
    { userId: est1.id, resourceId: res[21].id, startDateTime: dateFromNow(-3,14,0), endDateTime: dateFromNow(-3,16,0), status: "cancelada", purpose: "Reunion de proyecto final", attendees: 5 },
    // Repetitivas pendientes (18-19)
    { userId: doc1.id, resourceId: res[0].id, startDateTime: dateFromNow(3,8,0), endDateTime: dateFromNow(3,10,0), status: "pendiente", purpose: "Clase semanal de bases de datos I", attendees: 35, isRepetitive: true },
    { userId: doc2.id, resourceId: res[17].id, startDateTime: dateFromNow(5,14,0), endDateTime: dateFromNow(5,16,0), status: "pendiente", purpose: "Laboratorio semanal de programacion web", attendees: 30, isRepetitive: true },
  ]);

  // 9. LOANS (finalizadas 0-7 y activas 8-11)
  console.log("9/13 Insertando prestamos...");
  const lo = await Loan.bulkCreate([
    { reservationId: rv[0].id, deliveryTime: dateFromNow(-14,8,2), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[1].id, deliveryTime: dateFromNow(-12,14,3), employeeId: empInt.id, hasFailure: true },
    { reservationId: rv[2].id, deliveryTime: dateFromNow(-10,10,1), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[3].id, deliveryTime: dateFromNow(-8,8,7), employeeId: empSalud.id, hasFailure: true },
    { reservationId: rv[4].id, deliveryTime: dateFromNow(-7,14,2), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[5].id, deliveryTime: dateFromNow(-5,9,1), employeeId: empSalud.id, hasFailure: false },
    { reservationId: rv[6].id, deliveryTime: dateFromNow(-4,15,0), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[7].id, deliveryTime: dateFromNow(-3,8,1), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[8].id, deliveryTime: dateFromNow(-2,8,1), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[9].id, deliveryTime: dateFromNow(-1,10,2), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[10].id, deliveryTime: dateFromNow(0,14,1), employeeId: empInt.id, hasFailure: false },
    { reservationId: rv[11].id, deliveryTime: dateFromNow(0,16,0), employeeId: empInt.id, hasFailure: false },
  ]);

  // 10. RETURNS (solo finalizadas 0-7)
  console.log("10/13 Insertando devoluciones...");
  await Return.bulkCreate([
    { loanId: lo[0].id, returnTime: dateFromNow(-14,10,1), hasFailure: false, hasDamage: false, employeeId: empInt.id },
    { loanId: lo[1].id, returnTime: dateFromNow(-12,16,8), hasFailure: true, hasDamage: false, employeeId: empInt.id },
    { loanId: lo[2].id, returnTime: dateFromNow(-10,11,28), hasFailure: false, hasDamage: false, employeeId: empInt.id },
    { loanId: lo[3].id, returnTime: dateFromNow(-8,10,12), hasFailure: true, hasDamage: true, employeeId: empSalud.id },
    { loanId: lo[4].id, returnTime: dateFromNow(-7,16,3), hasFailure: false, hasDamage: false, employeeId: empInt.id },
    { loanId: lo[5].id, returnTime: dateFromNow(-5,11,2), hasFailure: false, hasDamage: false, employeeId: empSalud.id },
    { loanId: lo[6].id, returnTime: dateFromNow(-4,17,1), hasFailure: false, hasDamage: false, employeeId: empInt.id },
    { loanId: lo[7].id, returnTime: dateFromNow(-3,9,3), hasFailure: false, hasDamage: false, employeeId: empInt.id },
  ]);

  // 11. RATINGS (solo finalizadas 0-7)
  console.log("11/13 Insertando calificaciones...");
  await Rating.bulkCreate([
    { reservationId: rv[0].id, userId: est1.id, scheduleCompliance: 5, resourceQuality: 4, staffKindness: 5, averageStars: 4.67, comment: "Excelente salon, muy bien equipado" },
    { reservationId: rv[1].id, userId: est2.id, scheduleCompliance: 4, resourceQuality: 5, staffKindness: 4, averageStars: 4.33, comment: "Computadores con buen rendimiento" },
    { reservationId: rv[2].id, userId: doc1.id, scheduleCompliance: 5, resourceQuality: 4, staffKindness: 5, averageStars: 4.67, comment: "Sala ideal para reuniones pequenas" },
    { reservationId: rv[3].id, userId: est3.id, scheduleCompliance: 3, resourceQuality: 5, staffKindness: 4, averageStars: 4.00, comment: "Buen laboratorio pero demora en la entrega" },
    { reservationId: rv[4].id, userId: est4.id, scheduleCompliance: 5, resourceQuality: 5, staffKindness: 5, averageStars: 5.00, comment: "Perfecto para proyectos de desarrollo" },
    { reservationId: rv[5].id, userId: doc2.id, scheduleCompliance: 5, resourceQuality: 4, staffKindness: 5, averageStars: 4.67, comment: "Auditorio con excelente sonido" },
    { reservationId: rv[6].id, userId: est1.id, scheduleCompliance: 5, resourceQuality: 5, staffKindness: 5, averageStars: 5.00, comment: "Sala de proyectos muy completa" },
    { reservationId: rv[7].id, userId: persAdmin.id, scheduleCompliance: 5, resourceQuality: 4, staffKindness: 5, averageStars: 4.67, comment: "Buena sala para juntas pequenas" },
  ]);

  // 12. FAILURES
  console.log("12/13 Insertando fallos...");
  await Failure.bulkCreate([
    { loanId: lo[1].id, description: "Entrega con retardo de 3 minutos sobre el horario programado", status: "resuelto" },
    { loanId: lo[3].id, description: "Entrega tardia: empleado no disponible a la hora acordada", status: "pendiente" },
  ]);

  // 13. SANCTIONS
  console.log("13/13 Insertando sanciones...");
  await Sanction.create({
    userId: est2.id,
    reason: "Cancelacion tardia recurrente de reservas sin aviso previo",
    startDate: dateFromNow(-30),
    endDate: dateFromNow(30),
    isActive: true,
  });

  console.log("\n========================================");
  console.log("  BASE DE DATOS POBLADA EXITOSAMENTE");
  console.log("========================================");
  console.log(`  Unidades:           ${units.length}`);
  console.log(`  Usuarios:           ${users.length}`);
  console.log(`  Tipos de recurso:   ${rts.length}`);
  console.log(`  Recursos:           ${res.length}`);
  console.log(`  Reservas:           ${rv.length}`);
  console.log(`  Prestamos:          ${lo.length}`);
  console.log("========================================\n");

  await sequelize.close();
}

seed().catch((err) => {
  console.error("Error durante el seed:", err);
  process.exit(1);
});
