export const mockResourceTypes = [
  { id: '1', name: 'Aulas', description: 'Espacios para clases', granularity: 60 },
  { id: '2', name: 'Laboratorios', description: 'Laboratorios de cómputo', granularity: 120 },
  { id: '3', name: 'Equipos', description: 'Proyectores, laptops', granularity: 30 },
  { id: '4', name: 'Salas de reuniones', description: 'Espacios para reuniones', granularity: 60 },
];

export const mockResources = [
  {
    id: '1',
    name: 'Aula 101',
    description: 'Aula con capacidad para 40 personas',
    typeId: '1',
    typeName: 'Aulas',
    photoUrl: 'https://images.pexels.com/photos/7092613/pexels-photo-7092613.jpeg?auto=compress&cs=tinysrgb&w=400',
    capacity: 40,
    available: true,
  },
  {
    id: '2',
    name: 'Aula 102',
    description: 'Aula con capacidad para 30 personas',
    typeId: '1',
    typeName: 'Aulas',
    photoUrl: 'https://images.pexels.com/photos/8500429/pexels-photo-8500429.jpeg?auto=compress&cs=tinysrgb&w=400',
    capacity: 30,
    available: true,
  },
  {
    id: '3',
    name: 'Laboratorio A',
    description: 'Lab de cómputo con 25 equipos',
    typeId: '2',
    typeName: 'Laboratorios',
    photoUrl: 'https://images.pexels.com/photos/8761744/pexels-photo-8761744.jpeg?auto=compress&cs=tinysrgb&w=400',
    capacity: 25,
    available: true,
  },
  {
    id: '4',
    name: 'Proyector Sony 4K',
    description: 'Proyector de alta resolución',
    typeId: '3',
    typeName: 'Equipos',
    photoUrl: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
  },
  {
    id: '5',
    name: 'Sala Ejecutiva',
    description: 'Sala para 15 personas',
    typeId: '4',
    typeName: 'Salas de reuniones',
    photoUrl: 'https://images.pexels.com/photos/416320/pexels-photo-416320.jpeg?auto=compress&cs=tinysrgb&w=400',
    capacity: 15,
    available: true,
  },
];

export const mockReservations = [
  {
    id: '1',
    resourceId: '1',
    resourceName: 'Aula 101',
    userId: '2',
    userName: 'Juan Pérez',
    date: '2025-11-16',
    startTime: '08:00',
    endTime: '10:00',
    duration: 120,
    status: 'confirmed',
    createdAt: '2025-11-10T10:00:00',
  },
  {
    id: '2',
    resourceId: '3',
    resourceName: 'Laboratorio A',
    userId: '2',
    userName: 'Juan Pérez',
    date: '2025-11-17',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    status: 'confirmed',
    createdAt: '2025-11-10T11:00:00',
  },
  {
    id: '3',
    resourceId: '1',
    resourceName: 'Aula 101',
    userId: '3',
    userName: 'María García',
    date: '2025-11-14',
    startTime: '10:00',
    endTime: '12:00',
    duration: 120,
    status: 'completed',
    createdAt: '2025-11-08T09:00:00',
    rating: 5,
    comment: 'Excelente servicio',
  },
];

export const mockUsers = [
  {
    id: '1',
    email: 'admin@universidad.edu',
    name: 'Administrador',
    role: 'admin',
    active: true,
  },
  {
    id: '2',
    email: 'juan.perez@universidad.edu',
    name: 'Juan Pérez',
    role: 'profesor',
    active: true,
  },
  {
    id: '3',
    email: 'maria.garcia@universidad.edu',
    name: 'María García',
    role: 'estudiante',
    active: true,
  },
];

export const mockEmployees = [
  {
    id: '1',
    email: 'empleado1@universidad.edu',
    name: 'Carlos Ruiz',
    position: 'Encargado de préstamos',
    active: true,
  },
  {
    id: '2',
    email: 'empleado2@universidad.edu',
    name: 'Ana Torres',
    position: 'Asistente',
    active: true,
  },
];

export const mockUnits = [
  {
    id: '1',
    name: 'Unidad Central',
    description: 'Unidad principal de servicios',
    globalStartTime: '07:00',
    globalEndTime: '22:00',
    active: true,
  },
];

export const mockAvailability = [
  {
    id: '1',
    resourceTypeId: '1',
    resourceTypeName: 'Aulas',
    dayOfWeek: 'Lunes',
    startTime: '07:00',
    endTime: '22:00',
  },
  {
    id: '2',
    resourceTypeId: '2',
    resourceTypeName: 'Laboratorios',
    dayOfWeek: 'Lunes',
    startTime: '08:00',
    endTime: '20:00',
  },
];

export const mockLoans = [
  {
    id: '1',
    reservationId: '3',
    resourceName: 'Aula 101',
    userName: 'María García',
    employeeName: 'Carlos Ruiz',
    loanDate: '2025-11-14T10:00:00',
    returnDate: '2025-11-14T12:00:00',
    status: 'returned',
  },
];
