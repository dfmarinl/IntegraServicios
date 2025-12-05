import { useState, useEffect } from "react";
import { updateUserApi } from "../../api/user/user";
import "./EditUserForm.css";

const EditUserForm = ({ user, units, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    identificationNumber: user?.identificationNumber || "",
    age: user?.age || "",
    email: user?.email || "",
    rol: user?.rol || "estudiante",
    city: user?.city || "",
    direction: user?.direction || "",
    unitId: user?.unitId || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUnitField, setShowUnitField] = useState(
    user?.rol === "empleado_unidad"
  );

  // Actualizar formData cuando cambie el usuario
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        identificationNumber: user.identificationNumber || "",
        age: user.age || "",
        email: user.email || "",
        rol: user.rol || "estudiante",
        city: user.city || "",
        direction: user.direction || "",
        unitId: user.unitId || "",
      });
    }
  }, [user]);

  // Mostrar/ocultar campo de unidad según el rol seleccionado
  useEffect(() => {
    setShowUnitField(formData.rol === "empleado_unidad");

    // Si cambia de rol y no es empleado_unidad, limpiar unidadId
    if (formData.rol !== "empleado_unidad") {
      setFormData((prev) => ({
        ...prev,
        unitId: "",
      }));
    }
  }, [formData.rol]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    // Validar campos obligatorios
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.identificationNumber.trim() ||
      !formData.age ||
      !formData.email.trim() ||
      !formData.city.trim() ||
      !formData.direction.trim()
    ) {
      throw new Error("Todos los campos marcados con * son obligatorios");
    }

    // Validar edad
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      throw new Error("La edad debe ser un número entre 1 y 120");
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error("Por favor ingrese un email válido");
    }

    // Validar unidad para empleado_unidad
    if (formData.rol === "empleado_unidad" && !formData.unitId) {
      throw new Error("Debe seleccionar una unidad para empleados de unidad");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar formulario
      validateForm();

      // Preparar datos para enviar (no incluir password)
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        identificationNumber: formData.identificationNumber.trim(),
        age: parseInt(formData.age),
        email: formData.email.trim(),
        rol: formData.rol,
        city: formData.city.trim(),
        direction: formData.direction.trim(),
        unitId: formData.unitId || null,
      };

      // Actualizar usuario
      const updatedUser = await updateUserApi(user.id, userData);
      onSuccess(updatedUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Cargando datos del usuario...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="edit-user-form">
      {error && <div className="form-error">{error}</div>}

      {/* Información Personal */}
      <div className="form-section">
        <h3 className="form-section-title">Información Personal</h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              Nombre *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Juan"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Apellido *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Pérez"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="identificationNumber" className="form-label">
              Número de Identificación *
            </label>
            <input
              type="text"
              id="identificationNumber"
              name="identificationNumber"
              value={formData.identificationNumber}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: 1234567890"
              required
            />
            <small className="form-help">
              Cédula, documento de identidad, etc.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="age" className="form-label">
              Edad *
            </label>
            <input
              type="number"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: 25"
              min="1"
              max="120"
              required
            />
          </div>
        </div>
      </div>

      {/* Información de Contacto */}
      <div className="form-section">
        <h3 className="form-section-title">Información de Contacto</h3>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            placeholder="Ej: usuario@ejemplo.com"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="city" className="form-label">
              Ciudad *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Bogotá"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="direction" className="form-label">
              Dirección *
            </label>
            <input
              type="text"
              id="direction"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className="form-input"
              placeholder="Ej: Calle 123 #45-67"
              required
            />
          </div>
        </div>
      </div>

      {/* Rol y Unidad */}
      <div className="form-section">
        <h3 className="form-section-title">Rol y Asignación</h3>

        <div className="form-group">
          <label htmlFor="rol" className="form-label">
            Rol del Usuario *
          </label>
          <select
            id="rol"
            name="rol"
            value={formData.rol}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
            <option value="empleado_unidad">Empleado de Unidad</option>
            <option value="administrador">Administrador</option>
          </select>
          <small className="form-help">
            Define los permisos y acceso del usuario en el sistema
          </small>
        </div>

        {/* Campo de Unidad (solo para empleado_unidad) */}
        {showUnitField && (
          <div className="form-group">
            <label htmlFor="unitId" className="form-label">
              Unidad de Trabajo *
            </label>
            <select
              id="unitId"
              name="unitId"
              value={formData.unitId}
              onChange={handleChange}
              className="form-select"
              required={formData.rol === "empleado_unidad"}
              disabled={!units.length}
            >
              <option value="">Seleccionar unidad</option>
              {units.length === 0 ? (
                <option disabled>Cargando unidades...</option>
              ) : (
                units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))
              )}
            </select>
            <small className="form-help">
              Seleccione la unidad a la que pertenece el empleado
            </small>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outline"
          disabled={loading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar Usuario"}
        </button>
      </div>
    </form>
  );
};

export default EditUserForm;
