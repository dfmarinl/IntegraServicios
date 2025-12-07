import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import Login from "../pages/Login/Login";
import Registration from "../pages/Registration/Registration";
import AdminHome from "../pages/Home/Admin/AdminHome";
import EmployeeHome from "../pages/Home/Employee/EmployeeHome";
import UserHome from "../pages/Home/UserHome";
import ResourcesList from "../pages/Resources/ResourcesList";
import MyReservations from "../pages/Reservations/MyReservations";
import UnitsManagement from "../pages/Admin/UnitsManagement/UnitsManagement";
import ResourceTypesManagement from "../pages/Admin/ResourceTypesManagement/ResourceTypesManagement";
import ResourcesManagement from "../pages/Admin/ResourcesManagement/ResourcesManagement";
import UsersManagement from "../pages/Admin/UsersManagement/UsersManagement";
import UnitsView from "../components/User/UnitsView/UnitsView";
import ResourcesByTypeView from "../components/User/ResourcesByTypeView/ResourcesByTypeView";
import ResourceTypesView from "../components/User/ResourceTypesView/ResourceTypesView";
import ReservationsManagement from "../pages/Admin/ReservationsManagement/ReservationsManagement";
import LoansManagement from "../pages/Admin/LoansManagement/LoansManagement";
import Loader from "../components/common/Loader";
import ForgotPassword from "../pages/Login/ForgotPassword";
import ResetPassword from "../pages/Login/ResetPassword";
import StatsPage from "../pages/Admin/StatsPage/StatsPage";

// Objeto de mapeo de roles a rutas
const roleRoutes = {
  administrador: "/admin",
  empleado_unidad: "/employee",
  docente: "/app",
  personal_administrativo: "/app",
  estudiante: "/app",
};

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, auth, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles permitidos, verificar
  if (allowedRoles.length > 0 && !allowedRoles.includes(auth?.user?.rol)) {
    const route = roleRoutes[auth?.user?.rol] || "/app";
    return <Navigate to={route} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, auth, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (isAuthenticated && auth?.user) {
    const route = roleRoutes[auth.user.rol] || "/app";
    return <Navigate to={route} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Registration />
            </PublicRoute>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Ruta de administrador */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["administrador"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="units" element={<UnitsManagement />} />
          <Route path="resource-types" element={<ResourceTypesManagement />} />
          <Route path="resources" element={<ResourcesManagement />} />
          <Route
            path="availability"
            element={
              <div className="page-placeholder">
                <h1>Disponibilidad</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route path="reservations" element={<ReservationsManagement />} />
          <Route path="loans" element={<LoansManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="stats" element={<StatsPage />} />{" "}
          {/* Nueva ruta de estadísticas */}
          <Route
            path="employees"
            element={
              <div className="page-placeholder">
                <h1>Empleados</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="reports"
            element={
              <div className="page-placeholder">
                <h1>Reportes</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
        </Route>

        {/* Ruta de empleado de unidad */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["empleado_unidad"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<EmployeeHome />} />
          <Route path="resources" element={<ResourcesList />} />
          <Route path="reservations" element={<MyReservations />} />
          <Route path="stats" element={<StatsPage />} />{" "}
          {/* Nueva ruta de estadísticas */}
          <Route
            path="loans"
            element={
              <div className="page-placeholder">
                <h1>Gestión de Préstamos</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="returns"
            element={
              <div className="page-placeholder">
                <h1>Registro de Devoluciones</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
        </Route>

        {/* Ruta de docente (REDIRIGE A /app) */}
        <Route path="/teacher" element={<Navigate to="/app" replace />} />

        {/* Ruta de personal administrativo */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["personal_administrativo"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserHome />} />
          <Route path="resources" element={<ResourcesList />} />
          <Route path="reservations" element={<MyReservations />} />
        </Route>

        {/* Ruta compartida para estudiantes, docentes y personal administrativo */}
        <Route
          path="/app"
          element={
            <ProtectedRoute
              allowedRoles={[
                "estudiante",
                "docente",
                "personal_administrativo",
              ]}
            >
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserHome />} />
          {/* Rutas de recursos - Jerárquicas */}
          <Route path="resources" element={<UnitsView />} />
          <Route path="resources/browse">
            <Route path="unit/:unitId/types" element={<ResourceTypesView />} />
            <Route
              path="unit/:unitId/type/:typeId/resources"
              element={<ResourcesByTypeView />}
            />
          </Route>
          {/* Ruta de reserva individual */}
          <Route
            path="reserve/:resourceId"
            element={
              <div className="page-placeholder">
                <h1>Crear Reserva</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route path="reservations" element={<MyReservations />} />
          <Route path="stats" element={<StatsPage />} />{" "}
          {/* Nueva ruta de estadísticas */}
        </Route>

        {/* Ruta independiente para estadísticas (accesible desde cualquier layout) */}
        <Route
          path="/stats"
          element={
            <ProtectedRoute
              allowedRoles={[
                "administrador",
                "empleado_unidad",
                "docente",
                "personal_administrativo",
                "estudiante",
              ]}
            >
              <StatsPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
