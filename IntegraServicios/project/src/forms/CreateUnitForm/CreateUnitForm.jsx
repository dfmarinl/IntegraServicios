import React, { useState } from "react";
import { createUnitApi } from "../../api/unit/units";
import "./CreateUnitForm.css";

const CreateUnitForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    granularity: 30,
    isActive: true, // ← Valor por defecto TRUE
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validaciones adicionales del frontend
      if (!formData.name.trim()) {
        throw new Error("El nombre es requerido");
      }

      if (!formData.description.trim()) {
        throw new Error("La descripción es requerida");
      }

      if (formData.granularity < 15) {
        throw new Error("La granularidad mínima es 15 minutos");
      }

      const unitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        granularity: formData.granularity,
        isActive: true, // ← Siempre TRUE al crear
      };

      const newUnit = await createUnitApi(unitData);

      // Limpiar formulario
      setFormData({
        name: "",
        description: "",
        granularity: 30,
        isActive: true,
      });

      // Notificar éxito al componente padre
      if (onSuccess) {
        onSuccess(newUnit);
      }
    } catch (err) {
      setError(err.message || "Error al crear la unidad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-unit-form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Nombre de la Unidad *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder="Ej: Biblioteca Central"
          required
          disabled={loading}
        />
        <div className="form-hint">
          Este nombre debe ser único en el sistema
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Descripción *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Describe los servicios y características de esta unidad..."
          rows="3"
          required
          disabled={loading}
        />
        <div className="form-hint">
          Proporciona una descripción clara de la unidad
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="granularity" className="form-label">
          Granularidad (minutos) *
        </label>
        <select
          id="granularity"
          name="granularity"
          value={formData.granularity}
          onChange={handleChange}
          className="form-select"
          disabled={loading}
        >
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={45}>45 minutos</option>
          <option value={60}>60 minutos</option>
          <option value={90}>90 minutos</option>
          <option value={120}>120 minutos</option>
        </select>
        <div className="form-hint">
          Tiempo mínimo de préstamo para los recursos de esta unidad
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear Unidad"}
        </button>
      </div>
    </form>
  );
};

export default CreateUnitForm;
