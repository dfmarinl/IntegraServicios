import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import { forgotPasswordApi } from "../../api/user/auth"; // Ajusta la ruta según tu estructura
import "./Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await forgotPasswordApi(email);
      setSuccess("Se ha enviado un correo con las instrucciones para recuperar tu contraseña");
      
      // Opcional: Redirigir después de un tiempo
      setTimeout(() => {
        navigate("/login");
      }, 5000);

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
            <div className="login-icon">
              <img src="/icon.ico" alt="IntegraServicios Icon" />
            </div>
            <h1 className="login-title">Recuperar Contraseña</h1>
            <p className="login-subtitle">
              Ingresa tu correo electrónico para restablecer tu contraseña
            </p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}

          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess("")} />
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

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar Correo de Recuperación"}
            </Button>

            <div className="login-divider">
              <span>¿Recordaste tu contraseña?</span>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => navigate("/login")}
            >
              Volver al Inicio de Sesión
            </Button>
          </form>

          <div className="login-options" style={{ marginTop: "1rem", textAlign: "center" }}>
            <Link to="/register" className="forgot-link">
              ¿No tienes cuenta? Crear una
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;