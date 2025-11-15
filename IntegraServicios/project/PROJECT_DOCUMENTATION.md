# Sistema de Reservas - Documentación del Proyecto

## 📋 Descripción General

Sistema completo de gestión de reservas de recursos universitarios desarrollado en React (JavaScript puro, sin TypeScript). El sistema permite gestionar tipos de recursos, recursos, disponibilidad, reservas, préstamos, usuarios y reportes.

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
src/
├── api/                      # Capa de servicios API
│   ├── httpClient.js        # Cliente HTTP configurado
│   ├── mockData.js          # Datos mock para visualización
│   ├── resources.js         # Servicios de recursos
│   ├── resourceTypes.js     # Servicios de tipos de recurso
│   ├── availability.js      # Servicios de disponibilidad
│   ├── reservations.js      # Servicios de reservas
│   ├── users.js             # Servicios de usuarios/autenticación
│   ├── units.js             # Servicios de unidades
│   ├── loans.js             # Servicios de préstamos
│   └── reports.js           # Servicios de reportes
│
├── components/
│   └── common/              # Componentes reutilizables
│       ├── Button.jsx       # Botón genérico
│       ├── Input.jsx        # Input de formulario
│       ├── Select.jsx       # Select dropdown
│       ├── Modal.jsx        # Modal/Dialog
│       ├── Table.jsx        # Tabla de datos
│       ├── Card.jsx         # Tarjeta contenedora
│       ├── Alert.jsx        # Alertas/Notificaciones
│       └── Loader.jsx       # Indicador de carga
│
├── context/
│   ├── AuthContext.jsx      # Contexto de autenticación
│   └── UIContext.jsx        # Contexto de UI global
│
├── hooks/
│   ├── useFetch.js          # Hook para fetch de datos
│   └── useForm.js           # Hook para manejo de formularios
│
├── layouts/
│   ├── AdminLayout.jsx      # Layout para administradores
│   └── UserLayout.jsx       # Layout para usuarios
│
├── pages/
│   ├── Login/
│   │   └── Login.jsx        # Página de login
│   ├── Home/
│   │   ├── AdminHome.jsx    # Dashboard administrador
│   │   └── UserHome.jsx     # Home usuario
│   ├── Resources/
│   │   └── ResourcesList.jsx # Listado de recursos
│   └── Reservations/
│       └── MyReservations.jsx # Mis reservas
│
├── router/
│   └── AppRouter.jsx        # Configuración de rutas
│
├── utils/
│   ├── validations.js       # Funciones de validación
│   └── dateUtils.js         # Utilidades de fecha/hora
│
├── App.jsx                  # Componente principal
└── main.jsx                 # Punto de entrada
```

## 🔧 Tecnologías Utilizadas

- **React 18.3** - Framework principal
- **React Router v6** - Enrutamiento
- **date-fns** - Manejo de fechas
- **Chart.js** - Gráficos (instalado, pendiente implementar)
- **Vite** - Build tool
- **CSS Modules** - Estilos

## 🎯 Funcionalidades Implementadas

### HU-001 a HU-018 - Cobertura

El sistema cubre todas las historias de usuario solicitadas:

#### ✅ Completamente Funcionales (con datos mock)
- **HU-001**: Definir horario global (API preparada)
- **HU-002**: Registro de tipo de recurso (API + validaciones)
- **HU-003**: Registro de recurso (API + CRUD completo)
- **HU-004**: Definir disponibilidad (API + validación traslapes)
- **HU-005**: Consulta de recursos (Página completa con filtros)
- **HU-006**: Reserva de recurso (API + validación conflictos)
- **HU-011**: Calificación del servicio (Funcional en MyReservations)
- **HU-017**: Cancelación de reserva (Funcional en MyReservations)

#### 📝 API Preparada (pendiente UI completa)
- **HU-007**: Registro de préstamo
- **HU-008**: Registro de devolución
- **HU-009**: Consulta de reservas
- **HU-010**: Reservas repetitivas
- **HU-012**: Recursos más reservados
- **HU-013**: Recursos más prestado
- **HU-014**: Carga de datos iniciales
- **HU-015**: Gestión de unidades
- **HU-016**: Gestión de usuarios y empleados
- **HU-018**: Reporte de calificaciones

## 🚀 Modo de Uso

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm run preview
```

### Usuarios de Prueba (Modo Mock)

- **Administrador**: `admin@universidad.edu`
- **Profesor**: `juan.perez@universidad.edu`
- **Estudiante**: `maria.garcia@universidad.edu`
- **Contraseña**: Cualquier valor (modo demo)

## 📊 Características Técnicas

### 1. Capa API Modular

Todos los archivos en `src/api/` tienen:
- Constante `USE_MOCK = true` para usar datos simulados
- Funciones preparadas para llamadas reales al backend
- Validaciones de negocio (traslapes, conflictos, etc.)
- Simulación de latencia de red

### 2. Componentes Reutilizables

Todos los componentes en `src/components/common/` son:
- Completamente desacoplados
- Reciben props para configuración
- Tienen estilos CSS modulares propios
- No contienen lógica de negocio

### 3. Sistema de Autenticación

- Context API para estado global
- Persistencia en localStorage
- Rutas protegidas por rol
- Redirecciones automáticas

### 4. Validaciones

Archivo `utils/validations.js` incluye:
- Validación de emails
- Validación de horarios
- Detección de traslapes
- Validación de fechas futuras
- Validación de rangos globales

### 5. Layouts Diferenciados

- **AdminLayout**: Sidebar con navegación completa
- **UserLayout**: Header horizontal minimalista
- Notificaciones globales integradas
- Logout y perfil de usuario

## 🔄 Transición a Backend Real

Para conectar con un backend real:

1. **Cambiar flag en cada archivo API**:
   ```javascript
   const USE_MOCK = false; // Cambiar a false
   ```

2. **Configurar URL base**:
   ```javascript
   // En src/api/httpClient.js
   const API_BASE_URL = 'https://tu-api.com/api';
   ```

3. **Implementar autenticación real**:
   - Agregar tokens JWT
   - Incluir headers de autorización
   - Manejar refresh tokens

## 🎨 Diseño y Estilos

### Principios de Diseño Aplicados

1. **Jerarquía Visual**: Uso de tamaños de fuente y pesos para guiar la atención
2. **Espaciado Consistente**: Sistema de 8px para márgenes y padding
3. **Paleta de Colores**:
   - Primario: `#2563eb` (azul)
   - Éxito: `#16a34a` (verde)
   - Peligro: `#dc2626` (rojo)
   - Advertencia: `#ea580c` (naranja)
   - Neutros: Escala de grises

4. **Responsive**: Breakpoints en 768px para móviles

### Componentes con Animaciones

- Hover states en botones y cards
- Transiciones suaves en navegación
- Fade in para modales
- Loading spinners

## 📦 Próximos Pasos de Implementación

### Fase 1: Completar Páginas Admin
- Gestión de tipos de recurso (CRUD completo)
- Gestión de recursos (CRUD completo)
- Configuración de disponibilidad
- Gestión de unidades
- Gestión de usuarios y empleados

### Fase 2: Módulo de Préstamos
- Página de registro de préstamos
- Página de devoluciones
- Historial de préstamos

### Fase 3: Reportes y Analíticas
- Dashboard con gráficos (Chart.js)
- Reporte de recursos más reservados
- Reporte de calificaciones
- Exportación a CSV implementada

### Fase 4: Funcionalidades Avanzadas
- Reservas repetitivas (formulario completo)
- Carga masiva de datos
- Notificaciones por email
- Sistema de recordatorios

## 🔐 Seguridad

### Implementado
- Rutas protegidas por autenticación
- Rutas protegidas por rol (admin)
- Validación de permisos en componentes

### Por Implementar (Backend)
- Rate limiting
- Sanitización de inputs
- Prevención XSS/CSRF
- Encriptación de contraseñas
- Tokens JWT con expiración

## 📝 Notas Importantes

1. **Datos Mock**: Todos los datos son simulados en memoria. Se pierden al recargar.
2. **Sin TypeScript**: El proyecto usa JavaScript puro como se solicitó.
3. **Sin Backend**: Las APIs son simulaciones. Necesita backend real para producción.
4. **Extensible**: La arquitectura permite agregar nuevas funcionalidades fácilmente.
5. **Limpio**: No hay comentarios innecesarios, código está autoexplicado.

## 🤝 Convenciones de Código

- **Nombres**: CamelCase para componentes, camelCase para funciones
- **Archivos**: PascalCase para componentes (.jsx), camelCase para utilidades (.js)
- **Estilos**: Cada componente tiene su CSS propio
- **Imports**: Agrupados: React → Third Party → Local
- **Props**: Desestructuradas en parámetros de función

## 🐛 Debugging

Para activar logs en desarrollo:
```javascript
// En cada archivo API, agregar:
console.log('Request:', endpoint, data);
console.log('Response:', response);
```

---

**Versión**: 1.0.0
**Fecha**: Noviembre 2025
**Estado**: Funcional con datos mock, listo para integración con backend
