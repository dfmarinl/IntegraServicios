# IntegraServicios

Sistema web integral de gestion de recursos universitarios. Permite administrar unidades academicas, tipos de recursos, recursos fisicos (salones, salas de computo, laboratorios, etc.), reservas, prestamos, devoluciones, calificaciones y reportes, con un modelo de roles que diferencia permisos entre administradores, empleados de unidad y usuarios finales.

---

## Arquitectura

```
+-------------------+       +-------------------+       +-------------------+
|   Frontend        | HTTP  |   Backend         | SQL   |   PostgreSQL      |
|   React 18 + Vite |------>|   Express 5       |------>|   (Railway)       |
|                   |       |   Sequelize ORM   |       |                   |
+-------------------+       +-------------------+       +-------------------+
        |                           |
        |                           +-- 7 modulos de servicio
        |                           |   (user, unit, resource, reservation,
        |                           |    loan, rating, stats)
        +-- Vercel (deploy)
```

El backend esta organizado en **7 modulos de servicio** dentro de un monolito modular. Cada modulo encapsula sus rutas, controladores y logica de negocio, compartiendo una unica base de datos PostgreSQL a traves de Sequelize ORM.

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|---|---|---|
| **Frontend** | React | 18.3 |
| | React Router | v7 |
| | Vite | 5.4 |
| | Chart.js | 4.5 |
| | date-fns | 4.1 |
| **Backend** | Node.js | >=16 |
| | Express | 5.1 |
| | Sequelize | 6.37 |
| | PostgreSQL | (pg 8.16) |
| **Autenticacion** | JWT | 9.0 |
| | bcrypt | 6.0 |
| **Testing** | Jest | 29/30 |
| | Supertest | 7.0 |
| **Deploy** | Frontend | Vercel |
| | Backend | Render.com |
| | Base de datos | Railway.app |

---

## Funcionalidades

### Gestion de Recursos

- **Jerarquia completa**: Unidad -> Tipo de Recurso -> Recurso individual
- **CRUD completo** para cada nivel con busqueda, filtros y paginacion
- **Creacion por lotes**: Hasta 100 recursos con nombres auto-numerados
- **Configuracion de horarios** por unidad y por tipo de recurso, con validacion de consistencia jerarquica

### Sistema de Reservas

- **Reservas unicas y repetitivas** (diarias, semanales, mensuales, hasta 52 ocurrencias)
- **Deteccion automatica de conflictos** por traslape de horarios
- **Timezone-aware**: Toda la validacion temporal usa zona horaria de Colombia (UTC-5)
- **Cancelacion inteligente**: Individual, futuras repeticiones, o todas las repeticiones
- **Reglas de negocio**: Minimo 15 min de anticipacion, maximo 1 ano, granularidad configurable por tipo

### Prestamos y Devoluciones

- **Ciclo completo**: Reserva -> Prestamo (entrega) -> Devolucion -> Calificacion
- **Deteccion automatica de fallos**: Si la entrega o devolucion se desvia mas de 5 minutos del horario programado, se marca como fallo de servicio
- **Estadisticas por empleado y por unidad**

### Calificacion Multidimensional

- **3 dimensiones**: Cumplimiento de horario, Calidad del recurso, Amabilidad del personal
- Escala de 0 a 5 estrellas por dimension con promedio automatico
- Solo reservas finalizadas (con prestamo y devolucion) pueden ser calificadas

### Reportes y Estadisticas

- Recursos mas reservados por tipo en rango de fechas
- Recursos mas prestados con tasa de fallos y usuarios unicos
- Reporte de calificaciones con distribucion de estrellas
- Exportacion a PDF

### Seguridad y Autenticacion

- JWT con expiracion de 1 hora
- 5 roles: administrador, empleado_unidad, docente, estudiante, personal_administrativo
- Rutas protegidas por rol con middleware de autorizacion
- Recuperacion de contrasena por email con token de 15 minutos

---

## Estructura del Proyecto

```
IntegraServicios/
├── project/                          # Frontend (React + Vite)
│   └── src/
│       ├── api/                      # Capa de servicios HTTP (~20 modulos)
│       ├── components/
│       │   ├── common/               # Componentes reutilizables (9)
│       │   ├── User/                 # Componentes de usuario
│       │   └── admin/                # Componentes de administracion
│       ├── context/                  # AuthContext, UIContext
│       ├── hooks/                    # useFetch, useForm
│       ├── layouts/                  # AdminLayout, EmployeeLayout, UserLayout
│       ├── modals/                   # 12 modales especializados
│       ├── forms/                    # 13 formularios
│       ├── pages/                    # ~20 paginas por rol
│       ├── router/                   # Enrutamiento con proteccion por rol
│       └── utils/                    # Validaciones, utilidades de fecha, PDF
│
└── backend/                          # Backend (Node.js + Express)
    ├── config/                       # Database (Sequelize)
    ├── models/                       # 13 modelos Sequelize
    ├── services/                     # 7 modulos de servicio
    │   ├── user/                     # Auth, CRUD usuarios, middleware JWT
    │   ├── unit/                     # Unidades academicas y horarios
    │   ├── resource/                 # Tipos, recursos, horarios, API publica
    │   ├── reservation/              # Reservas, gestion admin, estadisticas
    │   ├── loan/                     # Prestamos y devoluciones
    │   ├── rating/                   # Calificaciones multidimensionales
    │   └── stats/                    # Reportes y analytics
    └── Tests/                        # 17 archivos de prueba
```

---

## Roles del Sistema

| Rol | Descripcion | Permisos principales |
|---|---|---|
| **administrador** | Gestiona todo el sistema | CRUD completo, reportes, gestion de usuarios y unidades |
| **empleado_unidad** | Empleado asignado a una unidad | Gestion de recursos y reservas de su unidad, prestamos/devoluciones |
| **docente** | Profesor universitario | Reservar recursos, calificar servicios |
| **estudiante** | Estudiante universitario | Reservar recursos, calificar servicios |
| **personal_administrativo** | Staff administrativo | Reservar recursos, calificar servicios |

---

## Endpoints API

| Grupo | Ruta | Descripcion |
|---|---|---|
| Autenticacion | `/api/auth` | Registro, login, recuperacion de contrasena, perfil |
| Usuarios | `/api/users` | CRUD usuarios, paginacion, busqueda |
| Unidades | `/api/units` | CRUD unidades academicas |
| Horarios de Unidad | `/api/unit-schedules` | Gestion de horarios semanales por unidad |
| Tipos de Recurso | `/api/resource-types` | CRUD tipos de recurso |
| Horarios de Tipo | `/api/type-schedules` | Horarios por tipo de recurso |
| Recursos | `/api/resources` | CRUD recursos, creacion por lotes |
| Reservas | `/api/reservations` | Crear, cancelar, disponibilidad, series repetitivas |
| Gestion Reservas | `/api/admin/reservations` | Dashboard, busqueda avanzada, reportes, acciones masivas |
| Prestamos | `/api/loans` | Registro de entrega de recursos |
| Devoluciones | `/api/returns` | Registro de devolucion de recursos |
| Calificaciones | `/api/ratings` | Calificacion en 3 dimensiones, estadisticas |
| Estadisticas | `/api/stats` | Recursos mas reservados/prestados, reporte de calificaciones |
| Publica | `/api/public` | Endpoint sin autenticacion para integracion externa |
| Fallos | `/api/failures` | Registro y consulta de fallos de servicio |

---

## Getting Started

### Requisitos

- Node.js >= 16
- npm >= 8
- PostgreSQL (o usar SQLite para desarrollo local)

### Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/usuario/IntegraServicios.git
cd IntegraServicios

# Instalar dependencias del backend
cd IntegraServicios/backend
npm install

# Instalar dependencias del frontend
cd ../project
npm install
```

### Desarrollo

```bash
# Backend (puerto 3001)
cd IntegraServicios/backend
npm run dev

# Frontend
cd IntegraServicios/project
npm run build
npm run preview
```

### Testing

```bash
cd IntegraServicios/backend

# Ejecutar todos los tests
npm test

# Tests por categoria
npm run test:unit          # Tests unitarios
npm run test:integration   # Tests de integracion
npm run test:coverage      # Con reporte de cobertura
```

---

## Modelos de Datos

```
Unit (Unidad Academica)
  └── ResourceType (Tipo de Recurso)
        ├── TypeSchedule (Horario del tipo)
        └── Resource (Recurso individual)
              └── Reservation (Reserva)
                    ├── Loan (Prestamo/Entrega)
                    │     └── Return (Devolucion)
                    └── Rating (Calificacion)

User (con 5 roles posibles)
```

---

## Convenciones

| Elemento | Convencion | Ejemplo |
|---|---|---|
| Componentes React | PascalCase + .jsx | `ReservationCalendar.jsx` |
| Utilidades | camelCase + .js | `dateUtils.js` |
| CSS | Mismo nombre que componente | `Button.css` |
| Modelos Sequelize | PascalCase + .js | `Reservation.js` |
| Rutas API | kebab-case plural | `/api/resource-types` |
| Controladores | camelCase + Controller | `reservationController.js` |

---

**Version**: 1.0.0 | **Estado**: Funcional en produccion
