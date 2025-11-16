import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import Login from "../pages/Login/Login";
import AdminHome from "../pages/Home/AdminHome";
import UserHome from "../pages/Home/UserHome";
import ResourcesList from "../pages/Resources/ResourcesList";
import MyReservations from "../pages/Reservations/MyReservations";
import Loader from "../components/common/Loader";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin() ? "/admin" : "/app"} replace />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route
            path="resource-types"
            element={
              <div className="page-placeholder">
                <h1>Tipos de Recurso</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="resources"
            element={
              <div className="page-placeholder">
                <h1>Gestión de Recursos</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="availability"
            element={
              <div className="page-placeholder">
                <h1>Disponibilidad</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="reservations"
            element={
              <div className="page-placeholder">
                <h1>Gestión de Reservas</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="loans"
            element={
              <div className="page-placeholder">
                <h1>Préstamos</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route
            path="users"
            element={
              <div className="page-placeholder">
                <h1>Usuarios</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
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
            path="units"
            element={
              <div className="page-placeholder">
                <h1>Unidades</h1>
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

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserHome />} />
          <Route path="resources" element={<ResourcesList />} />
          <Route
            path="resources/:id/reserve"
            element={
              <div className="page-placeholder">
                <h1>Crear Reserva</h1>
                <p>Página en construcción</p>
              </div>
            }
          />
          <Route path="reservations" element={<MyReservations />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
