<div align="center">

# 🏛️ IntegraServicios

### Sistema web integral de gestión de recursos universitarios

Administra unidades académicas, tipos de recursos, recursos físicos (salones, salas de cómputo, laboratorios, etc.), reservas, préstamos, devoluciones, calificaciones y reportes.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?logo=sequelize&logoColor=white)](https://sequelize.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Railway-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Jest](https://img.shields.io/badge/Tested%20with-Jest-C21325?logo=jest&logoColor=white)](https://jestjs.io)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#-licencia)
[![Status](https://img.shields.io/badge/Status-Producci%C3%B3n-success.svg)](#)

</div>

---

## 📑 Tabla de contenidos

- [Arquitectura](#-arquitectura)
- [Stack tecnológico](#-stack-tecnológico)
- [Funcionalidades](#-funcionalidades)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Roles del sistema](#-roles-del-sistema)
- [Endpoints API](#-endpoints-api)
- [Modelos de datos](#-modelos-de-datos)
- [Inicio rápido](#-inicio-rápido)
- [Variables de entorno](#-variables-de-entorno)
- [Testing](#-testing)
- [Convenciones](#-convenciones)
- [Despliegue](#-despliegue)
- [Licencia](#-licencia)

---

## 🏗️ Arquitectura

```mermaid
flowchart LR
    subgraph CLIENT["🖥️ Frontend"]
        FE["React 18 + Vite<br/>Vercel"]
    end
    subgraph SERVER["⚙️ Backend"]
        BE["Express 5<br/>Sequelize ORM<br/>Render.com"]
    end
    subgraph DATA["🗄️ Base de datos"]
        DB[("PostgreSQL<br/>Railway.app")]
    end

    FE -- "HTTP / REST" --> BE
    BE -- "SQL" --> DB
    BE -. "7 módulos de servicio" .- MODS["user · unit · resource<br/>reservation · loan · rating · stats"]
```

El backend está organizado en **7 módulos de servicio** dentro de un monolito modular. Cada módulo encapsula sus rutas, controladores y lógica de negocio, compartiendo una única base de datos PostgreSQL a través de Sequelize ORM.

---

## 🚀 Stack tecnológico

| Capa | Tecnología | Versión |
|:--|:--|:--|
| **Frontend** | React | 18.3 |
| | React Router | v7 |
| | Vite | 5.4 |
| | Chart.js | 4.5 |
| | date-fns | 4.1 |
| **Backend** | Node.js | >=16 |
| | Express | 5.1 |
| | Sequelize | 6.37 |
| | PostgreSQL (`pg`) | 8.16 |
| **Autenticación** | JWT | 9.0 |
| | bcrypt | 6.0 |
| **Testing** | Jest | 29 / 30 |
| | Supertest | 7.0 |
| **Despliegue** | Frontend | Vercel |
| | Backend | Render.com |
| | Base de datos | Railway.app |

---

## ✨ Funcionalidades

### 🗂️ Gestión de recursos
- **Jerarquía completa**: Unidad → Tipo de recurso → Recurso individual
- **CRUD completo** para cada nivel con búsqueda, filtros y paginación
- **Creación por lotes**: hasta 100 recursos con nombres auto-numerados
- **Configuración de horarios** por unidad y por tipo de recurso, con validación de consistencia jerárquica

### 📅 Sistema de reservas
- **Reservas únicas y repetitivas** (diarias, semanales, mensuales, hasta 52 ocurrencias)
- **Detección automática de conflictos** por traslape de horarios
- **Timezone-aware**: toda la validación temporal usa la zona horaria de Colombia (UTC-5)
- **Cancelación inteligente**: individual, futuras repeticiones o todas las repeticiones
- **Reglas de negocio**: mínimo 15 min de anticipación, máximo 1 año, granularidad configurable por tipo

### 🔁 Préstamos y devoluciones
- **Ciclo completo**: Reserva → Préstamo (entrega) → Devolución → Calificación
- **Detección automática de fallos**: si la entrega o devolución se desvía más de 5 minutos del horario programado, se marca como fallo de servicio
- **Estadísticas por empleado y por unidad**

### ⭐ Calificación multidimensional
- **3 dimensiones**: cumplimiento de horario, calidad del recurso, amabilidad del personal
- Escala de 0 a 5 estrellas por dimensión con promedio automático
- Solo reservas finalizadas (con préstamo y devolución) pueden ser calificadas

### 📊 Reportes y estadísticas
- Recursos más reservados por tipo en un rango de fechas
- Recursos más prestados con tasa de fallos y usuarios únicos
- Reporte de calificaciones con distribución de estrellas
- Exportación a PDF

### 🔐 Seguridad y autenticación
- JWT con expiración de 1 hora
- 5 roles: `administrador`, `empleado_unidad`, `docente`, `estudiante`, `personal_administrativo`
- Rutas protegidas por rol con middleware de autorización
- Recuperación de contraseña por email con token de 15 minutos

---

## 📁 Estructura del proyecto

```text
IntegraServicios/
├── README.md
└── IntegraServicios/
    ├── project/                          # 🖥️ Frontend (React + Vite)
    │   └── src/
    │       ├── api/                       # Capa de servicios HTTP (17 módulos)
    │       ├── components/
    │       │   ├── common/                # 9 componentes reutilizables
    │       │   ├── User/                  # Componentes de usuario
    │       │   └── admin/                 # Componentes de administración
    │       ├── context/                   # AuthContext, UIContext
    │       ├── hooks/                     # useAuth, useFetch, useForm
    │       ├── layouts/                   # AdminLayout, EmployeeLayout, UserLayout
    │       ├── modals/                    # 11 modales especializados
    │       ├── forms/                     # 13 formularios
    │       ├── pages/                     # Páginas por rol (~40 archivos)
    │       ├── router/                    # Enrutamiento con protección por rol
    │       └── utils/                     # Validaciones, fechas, PDF
    │
    └── backend/                           # ⚙️ Backend (Node.js + Express)
        ├── config/                        # Configuración de base de datos (Sequelize)
        ├── models/                        # 14 modelos Sequelize
        ├── helpers/                       # Utilidades de disponibilidad y slots
        ├── services/                      # 7 módulos de servicio
        │   ├── user/                      # Auth, usuarios, middleware JWT
        │   ├── unit/                      # Unidades académicas y horarios
        │   ├── resource/                  # Tipos, recursos, horarios, API pública
        │   ├── reservation/               # Reservas, gestión admin, estadísticas
        │   ├── loan/                      # Préstamos y devoluciones
        │   ├── rating/                    # Calificaciones multidimensionales
        │   └── stats/                     # Reportes y analítica
        ├── Tests/                         # 14 archivos de prueba
        └── index.js                       # Punto de entrada del servidor
```

> 💡 Cada módulo de servicio sigue el patrón `src/api/routes` (rutas) + `src/api/views` (controladores).

---

## 👥 Roles del sistema

| Rol | Descripción | Permisos principales |
|:--|:--|:--|
| **`administrador`** | Gestiona todo el sistema | CRUD completo, reportes, gestión de usuarios y unidades |
| **`empleado_unidad`** | Empleado asignado a una unidad | Gestión de recursos y reservas de su unidad, préstamos/devoluciones |
| **`docente`** | Profesor universitario | Reservar recursos, calificar servicios |
| **`estudiante`** | Estudiante universitario | Reservar recursos, calificar servicios |
| **`personal_administrativo`** | Staff administrativo | Reservar recursos, calificar servicios |

---

## 🔌 Endpoints API

| Grupo | Ruta | Descripción |
|:--|:--|:--|
| Autenticación | `/api/auth` | Registro, login, recuperación de contraseña, perfil |
| Usuarios | `/api/users` | CRUD usuarios, paginación, búsqueda |
| Unidades | `/api/units` | CRUD unidades académicas |
| Horarios de unidad | `/api/unit-schedules` | Gestión de horarios semanales por unidad |
| Tipos de recurso | `/api/resource-types` | CRUD tipos de recurso |
| Horarios de tipo | `/api/type-schedules` | Horarios por tipo de recurso |
| Recursos | `/api/resources` | CRUD recursos, creación por lotes |
| Disponibilidad | `/api/availabilities` | Consulta de disponibilidad de recursos |
| Reservas | `/api/reservations` | Crear, cancelar, disponibilidad, series repetitivas |
| Gestión de reservas | `/api/admin/reservations` | Dashboard, búsqueda avanzada, reportes, acciones masivas |
| Préstamos | `/api/loans` | Registro de entrega de recursos |
| Devoluciones | `/api/returns` | Registro de devolución de recursos |
| Calificaciones | `/api/ratings` | Calificación en 3 dimensiones, estadísticas |
| Estadísticas | `/api/stats` | Recursos más reservados/prestados, reporte de calificaciones |
| Pública | `/api/public` | Endpoint sin autenticación para integración externa |
| Fallos | `/api/failures` | Registro y consulta de fallos de servicio |
| Salud | `/health` | Health check del servicio |

---

## 🧬 Modelos de datos

```text
Unit (Unidad Académica)
  ├── UnitSchedule (Horario de la unidad)
  └── ResourceType (Tipo de Recurso)
        ├── TypeSchedule (Horario del tipo)
        └── Resource (Recurso individual)
              ├── Availability (Disponibilidad)
              └── Reservation (Reserva)
                    ├── Loan (Préstamo / Entrega)
                    │     └── Return (Devolución)
                    ├── Rating (Calificación)
                    └── Failure (Fallo de servicio)

User (con 5 roles posibles)
  ├── UserUnit (Asignación usuario ↔ unidad)
  └── Sanction (Sanciones)
```

**14 modelos Sequelize:** `Unit`, `UnitSchedule`, `ResourceType`, `TypeSchedule`, `Resource`, `Availability`, `Reservation`, `Loan`, `Return`, `Rating`, `Failure`, `Sanction`, `UserUnit`, `User`.

---

## ⚡ Inicio rápido

### Requisitos

- **Node.js** `>= 16`
- **npm** `>= 8`
- **PostgreSQL** (o SQLite para desarrollo local)

### 1. Clonar el repositorio

```bash
git clone https://github.com/dfmarinl/IntegraServicios.git
cd IntegraServicios/IntegraServicios
```

### 2. Instalar dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../project
npm install
```

### 3. Ejecutar en desarrollo

```bash
# Backend  →  http://localhost:3001
cd backend
npm run dev

# Frontend  →  http://localhost:5173
cd ../project
npm run dev
```

### Build de producción (frontend)

```bash
cd project
npm run build
npm run preview
```

---

## 🔑 Variables de entorno

Crea un archivo `.env` en `IntegraServicios/backend/` con las siguientes variables:

| Variable | Descripción | Ejemplo |
|:--|:--|:--|
| `NODE_ENV` | Entorno de ejecución | `development` / `production` |
| `PORT` | Puerto del servidor backend | `3001` |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `DB_NAME` | Nombre de la base de datos (uso local) | `integraservicios` |
| `DB_USER` | Usuario de la base de datos (uso local) | `postgres` |
| `DB_PASSWORD` | Contraseña de la base de datos (uso local) | `********` |
| `DB_HOST` | Host de la base de datos (uso local) | `localhost` |
| `DB_PORT` | Puerto de la base de datos (uso local) | `5432` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | `una-cadena-larga-y-aleatoria` |
| `EMAIL_USER` | Correo para el envío de notificaciones | `no-reply@dominio.com` |
| `EMAIL_PASS` | Contraseña / app password del correo | `********` |

> ⚠️ **Nunca** subas tu archivo `.env` ni credenciales reales al repositorio.

---

## 🧪 Testing

```bash
cd backend

# Todos los tests
npm test

# Suites completas (unitarias + integración + seguridad + API + base de datos)
npm run test:unit          # Jest sobre la carpeta Tests/
npm run test:integration   # Jest sobre la carpeta Tests/

# Suite por caso de prueba
npm run test:tc-unit-001
npm run test:tc-api-001
npm run test:tc-int-001
npm run test:tc-sec-001
npm run test:tc-db-001

# Reporte de cobertura
npm run test:coverage
```

**14 archivos de prueba** organizados por tipo: `TC-UNIT-*`, `TC-INT-*`, `TC-SEC-*`, `TC-API-*`, `TC-DB-*` y pruebas por dominio (`auth`, `users`, `units`, `schedules`, `resourceTypes`).

---

## 📐 Convenciones

| Elemento | Convención | Ejemplo |
|:--|:--|:--|
| Componentes React | PascalCase + `.jsx` | `ReservationCalendar.jsx` |
| Utilidades | camelCase + `.js` | `dateUtils.js` |
| CSS | Mismo nombre que el componente | `Button.css` |
| Modelos Sequelize | PascalCase + `.js` | `Reservation.js` |
| Rutas API | kebab-case plural | `/api/resource-types` |
| Controladores | camelCase + `Controller` | `reservationController.js` |

---

## 🚢 Despliegue

| Componente | Plataforma | Notas |
|:--|:--|:--|
| Frontend | **Vercel** | Build con Vite |
| Backend | **Render.com** | Health check en `/health`, puerto `10000` |
| Base de datos | **Railway.app** | PostgreSQL en la nube |

---

## 📄 Licencia

Distribuido bajo la licencia **ISC**.

---

<div align="center">

**IntegraServicios** · v1.0.0 · Hecho con ❤️ para la gestión de recursos universitarios

</div>
