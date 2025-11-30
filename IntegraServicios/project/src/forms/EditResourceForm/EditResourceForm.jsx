import { useState, useEffect } from "react";
import { updateResourceApi } from "../../api/Resource/Resource";
import "./EditResourceForm.css";

const EditResourceForm = ({ resource, resourceTypes, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    photoUrl: "",
    features: {},
    typeId: "",
    isAvailable: true,
  });
  const [featureKey, setFeatureKey] = useState("");
  const [featureValue, setFeatureValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del recurso cuando se monta el componente
  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name || "",
        photoUrl: resource.photoUrl || "",
        features: resource.features || {},
        typeId: resource.typeId || "",
        isAvailable: resource.isAvailable !== undefined ? resource.isAvailable : true,
      });
    }
  }, [resource]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddFeature = () => {
    if (featureKey.trim() && featureValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: {
          ...prev.features,
          [featureKey.trim()]: featureValue.trim()
        }
      }));
      setFeatureKey("");
      setFeatureValue("");
    }
  };

  const handleRemoveFeature = (key) => {
    setFormData((prev) => {
      const newFeatures = { ...prev.features };
      delete newFeatures[key];
      return {
        ...prev,
        features: newFeatures
      };
    });
  };

  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFeature();
    }
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

      if (!formData.photoUrl.trim()) {
        throw new Error("La URL de la foto es requerida");
      }

      if (!formData.typeId) {
        throw new Error("Debe seleccionar un tipo de recurso");
      }

      // Validar URL de la foto
      try {
        new URL(formData.photoUrl);
      } catch (urlError) {
        throw new Error("La URL de la foto no es válida");
      }

      const resourceData = {
        name: formData.name.trim(),
        photoUrl: formData.photoUrl.trim(),
        features: formData.features,
        typeId: parseInt(formData.typeId),
        isAvailable: formData.isAvailable,
      };

      const updatedResource = await updateResourceApi(
        resource.id,
        resourceData
      );
      onSuccess(updatedResource);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-resource-form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Nombre del Recurso *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder="Ej: Computadora Portátil Dell XPS 13"
          required
          disabled={loading}
        />
        <small className="form-help">
          Nombre descriptivo y único para identificar el recurso
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="photoUrl" className="form-label">
          URL de la Foto *
        </label>
        <input
          type="url"
          id="photoUrl"
          name="photoUrl"
          value={formData.photoUrl}
          onChange={handleChange}
          className="form-input"
          placeholder="https://ejemplo.com/foto-recurso.jpg"
          required
          disabled={loading}
        />
        <small className="form-help">
          Enlace a una imagen del recurso. Asegúrate de que la URL sea accesible.
        </small>
        
        {/* Vista previa de la imagen */}
        {formData.photoUrl && (
          <div className="image-preview">
            <p className="preview-label">Vista previa:</p>
            <img 
              src={formData.photoUrl} 
              alt="Vista previa" 
              className="preview-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="typeId" className="form-label">
          Tipo de Recurso *
        </label>
        <select
          id="typeId"
          name="typeId"
          value={formData.typeId}
          onChange={handleChange}
          className="form-select"
          required
          disabled={loading}
        >
          <option value="">Seleccionar tipo de recurso</option>
          {resourceTypes && resourceTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} {type.unit && `- ${type.unit.name}`}
            </option>
          ))}
        </select>
        <small className="form-help">
          Selecciona la categoría a la que pertenece este recurso
        </small>
      </div>

      {/* Características del recurso */}
      <div className="form-group">
        <label className="form-label">
          Características del Recurso
        </label>
        <div className="features-input-group">
          <div className="features-inputs">
            <input
              type="text"
              placeholder="Característica (ej: capacidad, modelo)"
              value={featureKey}
              onChange={(e) => setFeatureKey(e.target.value)}
              onKeyPress={handleFeatureKeyPress}
              className="form-input feature-input"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Valor (ej: 20 personas, Dell XPS)"
              value={featureValue}
              onChange={(e) => setFeatureValue(e.target.value)}
              onKeyPress={handleFeatureKeyPress}
              className="form-input feature-input"
              disabled={loading}
            />
            <button
              type="button"
              onClick={handleAddFeature}
              className="btn-feature-add"
              disabled={loading || !featureKey.trim() || !featureValue.trim()}
            >
              Agregar
            </button>
          </div>
          <small className="form-help">
            Agrega características específicas del recurso (ej: capacidad, modelo, especificaciones técnicas)
          </small>
        </div>

        {/* Lista de características agregadas */}
        {Object.keys(formData.features).length > 0 && (
          <div className="features-list">
            <p className="features-list-title">Características agregadas:</p>
            {Object.entries(formData.features).map(([key, value]) => (
              <div key={key} className="feature-item">
                <span className="feature-key">{key}:</span>
                <span className="feature-value">{value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(key)}
                  className="feature-remove"
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="checkbox-input"
              disabled={loading}
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">Recurso disponible para préstamos</span>
          </label>
        </div>
        <small className="form-help">
          Si está desmarcado, el recurso no podrá ser reservado temporalmente
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
          {loading ? "Actualizando..." : "Actualizar Recurso"}
        </button>
      </div>
    </form>
  );
};

export default EditResourceForm;