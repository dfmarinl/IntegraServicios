# 📁 Estructura del Proyecto - Sistema de Reservas

## Árbol de Directorios

```
project/
│
├── src/
│   ├── api/                          # 🔌 Capa de Servicios API
│   │   ├── httpClient.js            # Cliente HTTP base
│   │   ├── mockData.js              # Datos de prueba
│   │   ├── availability.js          # API disponibilidad
│   │   ├── loans.js                 # API préstamos
│   │   ├── reports.js               # API reportes
│   │   ├── reservations.js          # API reservas
│   │   ├── resourceTypes.js         # API tipos recurso
│   │   ├── resources.js             # API recursos
│   │   ├── units.js                 # API unidades
│   │   └── users.js                 # API usuarios/auth
│   │
│   ├── components/
│   │   └── common/                   # 🧩 Componentes Reutilizables
│   │       ├── Alert.jsx/.css       # Alertas
│   │       ├── Button.jsx/.css      # Botones
│   │       ├── Card.jsx/.css        # Tarjetas
│   │       ├── Input.jsx/.css       # Inputs
│   │       ├── Loader.jsx/.css      # Loading
│   │       ├── Modal.jsx/.css       # Modales
│   │       ├── Select.jsx/.css      # Selects
│   │       └── Table.jsx/.css       # Tablas
│   │
│   ├── context/                      # 🌐 Estado Global
│   │   ├── AuthContext.jsx          # Autenticación
│   │   └── UIContext.jsx            # UI/Notificaciones
│   │
│   ├── hooks/                        # 🪝 Custom Hooks
│   │   ├── useFetch.js              # Fetch con loading/error
│   │   └── useForm.js               # Manejo formularios
│   │
│   ├── layouts/                      # 📐 Layouts
│   │   ├── AdminLayout.jsx/.css     # Layout admin (sidebar)
│   │   └── UserLayout.jsx/.css      # Layout usuario (header)
│   │
│   ├── pages/                        # 📄 Páginas
│   │   ├── Home/
│   │   │   ├── AdminHome.jsx/.css   # Dashboard admin
│   │   │   └── UserHome.jsx/.css    # Home usuario
│   │   ├── Login/
│   │   │   └── Login.jsx/.css       # Login
│   │   ├── Reservations/
│   │   │   └── MyReservations.jsx/.css # Mis reservas
│   │   └── Resources/
│   │       └── ResourcesList.jsx/.css  # Lista recursos
│   │
│   ├── router/
│   │   └── AppRouter.jsx             # ⚙️ Configuración rutas
│   │
│   ├── utils/                        # 🛠️ Utilidades
│   │   ├── dateUtils.js             # Manejo fechas/CSV
│   │   └── validations.js           # Validaciones
│   │
│   ├── App.jsx                       # Componente raíz
│   ├── App.css                       # Estilos globales App
│   ├── index.css                     # Estilos base
│   └── main.jsx                      # Punto de entrada
│
├── public/                           # Archivos estáticos
├── dist/                             # Build de producción
│
├── package.json                      # Dependencias
├── vite.config.js                    # Config Vite
├── PROJECT_DOCUMENTATION.md          # 📚 Docs completa
└── ESTRUCTURA.md                     # Este archivo
```

## 🎯 Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes | PascalCase + .jsx | `Button.jsx` |
| Utilidades | camelCase + .js | `validations.js` |
| Contexts | PascalCase + Context | `AuthContext.jsx` |
| Hooks | camelCase + use prefix | `useFetch.js` |
| APIs | camelCase + .js | `resources.js` |
| CSS | Mismo nombre que componente | `Button.css` |

## 🔀 Flujo de Datos

```
Usuario
  ↓
Página (pages/)
  ↓
Hook (useFetch)
  ↓
API (api/)
  ↓
Mock Data (actualmente)
  ↓
Backend Real (futuro)
```

## 🚦 Rutas del Sistema

### Públicas
- `/login` - Página de login

### Usuario (Profesor/Estudiante)
- `/app` - Home usuario
- `/app/resources` - Listado recursos
- `/app/resources/:id/reserve` - Crear reserva
- `/app/reservations` - Mis reservas

### Administrador
- `/admin` - Dashboard admin
- `/admin/resource-types` - Tipos de recurso
- `/admin/resources` - Gestión recursos
- `/admin/availability` - Disponibilidad
- `/admin/reservations` - Todas las reservas
- `/admin/loans` - Préstamos
- `/admin/users` - Usuarios
- `/admin/employees` - Empleados
- `/admin/units` - Unidades
- `/admin/reports` - Reportes

## 📦 Componentes Creados

### ✅ Totalmente Funcionales
1. **Button** - Botón con variantes (primary, secondary, danger, success, outline)
2. **Input** - Input con label, validación y error
3. **Select** - Dropdown con opciones
4. **Modal** - Modal/Dialog con overlay
5. **Table** - Tabla con columnas configurables
6. **Card** - Contenedor con título y acciones
7. **Alert** - Notificaciones con tipos (success, error, warning, info)
8. **Loader** - Spinner de carga

## 🎨 Sistema de Colores

```css
/* Primarios */
--blue-600: #2563eb;      /* Acciones principales */
--gray-900: #111827;      /* Textos principales */
--gray-600: #6b7280;      /* Textos secundarios */

/* Estados */
--green-600: #16a34a;     /* Éxito */
--red-600: #dc2626;       /* Error/Peligro */
--orange-600: #ea580c;    /* Advertencia */
--yellow-500: #eab308;    /* Alerta */

/* Fondos */
--gray-50: #f9fafb;       /* Fondo claro */
--gray-100: #f3f4f6;      /* Fondo alternativo */
--white: #ffffff;         /* Blanco puro */
```

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Linter
npm run lint
```

## 📝 Archivos de Configuración

- `vite.config.js` - Configuración Vite
- `eslint.config.js` - Reglas ESLint
- `package.json` - Dependencias y scripts

---

**Total de archivos creados**: ~50 archivos
**Líneas de código**: ~6000+ líneas
**Componentes reutilizables**: 8
**Páginas**: 5 (más placeholders)
**APIs**: 8 módulos completos
