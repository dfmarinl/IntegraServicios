import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import "./Login.css";

const testAccounts = [
  { email: "carlos.ramirez@universidad.edu", role: "Administrador" },
  { email: "ana.martinez@universidad.edu", role: "Empleado de Unidad" },
  { email: "sandra.lopez@universidad.edu", role: "Docente" },
  { email: "maria.garcia@universidad.edu", role: "Estudiante" },
  { email: "diana.rojas@universidad.edu", role: "Personal Administrativo" },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

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

  const fillCredentials = (emailValue) => {
    setEmail(emailValue);
    setPassword("password123");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
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

          <div className="credentials-section">
            <button
              type="button"
              className="credentials-toggle"
              onClick={() => setShowCredentials(!showCredentials)}
            >
              <span>Cuentas de prueba</span>
              <span className={`credentials-arrow ${showCredentials ? "open" : ""}`}>
                &#9662;
              </span>
            </button>

            {showCredentials && (
              <div className="credentials-content">
                <p className="credentials-hint">
                  Contraseña universal: <strong>password123</strong>
                </p>
                <div className="credentials-list">
                  {testAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className="credential-item"
                      onClick={() => fillCredentials(acc.email)}
                    >
                      <span className="credential-email">{acc.email}</span>
                      <span className="credential-role">{acc.role}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
