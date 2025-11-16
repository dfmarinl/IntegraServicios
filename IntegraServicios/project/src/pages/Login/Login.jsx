import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

    const result = await login(email, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Sistema de Reservas</h1>
          <p className="login-subtitle">
            Ingresa tus credenciales para continuar
          </p>

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
              placeholder="usuario@universidad.edu"
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="login-demo">
            <p className="demo-title">Usuarios de prueba:</p>
            <ul className="demo-list">
              <li>
                <strong>Admin:</strong> admin@universidad.edu
              </li>
              <li>
                <strong>Profesor:</strong> juan.perez@universidad.edu
              </li>
              <li>
                <strong>Estudiante:</strong> maria.garcia@universidad.edu
              </li>
            </ul>
            <p className="demo-note">
              Cualquier contraseña es válida en modo demo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
