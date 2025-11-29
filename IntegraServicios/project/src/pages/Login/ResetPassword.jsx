import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import { resetPasswordApi } from "../../api/user/auth";
import "./Login.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // Verificar si el token está presente
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError("Enlace de recuperación inválido o expirado");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones del frontend
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!token) {
      setError("Token de recuperación inválido");
      return;
    }

    setLoading(true);

    try {
      await resetPasswordApi(token, password);

      setSuccess("¡Contraseña restablecida correctamente! Redirigiendo al login...");
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (err) {
      setError(err.message);
      if (err.message.includes("token") || err.message.includes("expired") || err.message.includes("Link expired")) {
        setTokenValid(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-icon">
                <img src="/icon.ico" alt="IntegraServicios Icon" />
              </div>
              <h1 className="login-title">Enlace Inválido</h1>
              <p className="login-subtitle">
                El enlace de recuperación ha expirado o es inválido
              </p>
            </div>

            <Alert 
              type="error" 
              message="Este enlace de recuperación ha expirado o ya fue utilizado. Por favor, solicita un nuevo correo de recuperación." 
            />

            <div style={{ marginTop: "2rem" }}>
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={() => navigate("/forgot-password")}
              >
                Solicitar Nuevo Correo
              </Button>

              <div className="login-divider">
                <span>o</span>
              </div>

              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={() => navigate("/login")}
              >
                Volver al Inicio de Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <img src="/icon.ico" alt="IntegraServicios Icon" />
            </div>
            <h1 className="login-title">Restablecer Contraseña</h1>
            <p className="login-subtitle">
              Ingresa tu nueva contraseña
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
              label="Nueva Contraseña"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              minLength="8"
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              minLength="8"
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading || !token}
            >
              {loading ? "Restableciendo..." : "Restablecer Contraseña"}
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
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;