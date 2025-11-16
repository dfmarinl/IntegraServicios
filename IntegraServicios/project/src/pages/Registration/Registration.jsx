import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Alert from "../../components/common/Alert";
import "./Registration.css";

const Registration = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    identificationNumber: "",
    age: "",
    email: "",
    city: "",
    direction: "",
    password: "",
    confirmPassword: "",
    // El rol siempre será "estudiante" por defecto
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (formData.age < 16 || formData.age > 100) {
      setError("La edad debe estar entre 16 y 100 años");
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar (sin confirmPassword) y agregar rol fijo
      const { confirmPassword, ...userData } = formData;
      const userDataWithRole = {
        ...userData,
        rol: "estudiante", // Rol fijo para todos los registros
      };

      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDataWithRole),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en el registro");
      }

      const result = await response.json();
      setSuccess("¡Cuenta creada exitosamente! Redirigiendo al login...");

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Cuenta creada exitosamente. Por favor inicia sesión.",
          },
        });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <h1 className="register-title">Crear Cuenta</h1>
            <p className="register-subtitle">
              Regístrate en el sistema IntegraServicios
            </p>
          </div>

          {error && (
            <Alert type="error" message={error} onClose={() => setError("")} />
          )}

          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <Input
                label="Nombres"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="María"
                required
              />
              <Input
                label="Apellidos"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Gómez"
                required
              />
            </div>

            <Input
              label="Número de identificación"
              type="text"
              name="identificationNumber"
              value={formData.identificationNumber}
              onChange={handleChange}
              placeholder="123456789"
              required
            />

            <div className="form-row">
              <Input
                label="Edad"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="23"
                min="16"
                max="100"
                required
              />
              {/* Se eliminó el Select de rol */}
            </div>

            <Input
              label="Correo electrónico"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="usuario@universidad.edu.co"
              required
            />

            <Input
              label="Ciudad"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Bogotá"
              required
            />

            <Input
              label="Dirección"
              type="text"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              placeholder="Carrera 15 # 40-25"
              required
            />

            <div className="form-row">
              <Input
                label="Contraseña"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <Input
                label="Confirmar Contraseña"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>

            <div className="register-divider">
              <span>¿Ya tienes cuenta?</span>
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => navigate("/login")}
            >
              Iniciar Sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
