import React, { useState, useEffect } from "react";
import { updateUnitApi } from "../../api/unit/units";
import "./EditUnitForm.css";

const EditUnitForm = ({ unit, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    granularity: 30,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar datos de la unidad cuando el componente se monta o cambia la unidad
  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || "",
        description: unit.description || "",
        granularity: unit.granularity || 30,
        isActive: unit.isActive !== undefined ? unit.isActive : true,
      });
    }
  }, [unit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

      if (formData.granularity < 15) {
        throw new Error("La granularidad mínima es 15 minutos");
      }

      const unitData = {
        ...formData,
        name: formData.name.trim(), // Limpiar espacios
      };

      const updatedUnit = await updateUnitApi(unit.id, unitData);

      // Notificar éxito al componente padre
      if (onSuccess) {
        onSuccess(updatedUnit);
      }
    } catch (err) {
      setError(err.message || "Error al actualizar la unidad");
    } finally {
      setLoading(false);
    }
  };

  if (!unit) {
    return <div>Error: No se ha seleccionado ninguna unidad</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="edit-unit-form">
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
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Describe los servicios y características de esta unidad..."
          rows="3"
          disabled={loading}
        />
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

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            disabled={loading}
            className="checkbox-input"
          />
          <span className="checkbox-custom"></span>
          Unidad activa
        </label>
        <div className="form-hint">
          Las unidades inactivas no estarán disponibles para préstamos
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
          {loading ? "Actualizando..." : "Actualizar Unidad"}
        </button>
      </div>
    </form>
  );
};

export default EditUnitForm;
