import { useState, useEffect } from "react";
import { updateResourceTypeApi } from "../../api/Resource/resourceType";
import "./EmployeeEditResourceTypeForm.css";

const EmployeeEditResourceTypeForm = ({
  resourceType,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    granularity: 30,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del tipo de recurso cuando se monta el componente
  useEffect(() => {
    if (resourceType) {
      setFormData({
        name: resourceType.name || "",
        description: resourceType.description || "",
        granularity: resourceType.granularity || 30,
      });
    }
  }, [resourceType]);

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
    setError(null);

    try {
      // Validaciones básicas
      if (!formData.name.trim()) {
        throw new Error("El nombre es requerido");
      }

      const resourceTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        granularity: parseInt(formData.granularity),
        unitId: resourceType.unitId, // Mantener la unidad original, no se modifica
      };

      const updatedResourceType = await updateResourceTypeApi(
        resourceType.id,
        resourceTypeData
      );
      onSuccess(updatedResourceType);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="employee-edit-resource-type-form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Nombre *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder="Ej: Laboratorio de Computación, Sala de Conferencias"
          required
        />
        <small className="form-help">
          Nombre único para el tipo de recurso
        </small>
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
          placeholder="Descripción detallada del tipo de recurso..."
          rows="3"
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
          required
        >
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">1 hora</option>
          <option value="120">2 horas</option>
          <option value="240">4 horas</option>
          <option value="480">8 horas</option>
        </select>
        <small className="form-help">
          Tiempo mínimo de reserva para este tipo de recurso
        </small>
      </div>

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
          {loading ? "Actualizando..." : "Actualizar Tipo de Recurso"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeEditResourceTypeForm;
