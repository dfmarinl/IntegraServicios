import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            {/* Icono agregado aquí */}
            <div className="login-icon">
              <img src="/icon.ico" alt="IntegraServicios Icon" />
            </div>
            <h1 className="login-title">IntegraServicios</h1>
            <p className="login-subtitle">
              Sistema de Gestión de Recursos Universitarios
            </p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@universidad.edu.co"
              required
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="login-options">
              <Link to="/forgot-password" className="forgot-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>

            <div className="login-divider">
              <span>¿No tienes cuenta?</span>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => navigate("/register")}
            >
              Crear Cuenta
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
