import React, { useState, useEffect } from "react";
import { createResourceApi } from "../../api/Resource/Resource";
import { uploadReosurseImage } from "../../api/Resource/ResourceImg"; // Asegúrate de que la ruta sea correcta
import "./CreateResourceForm.css";

const CreateResourceForm = ({ resourceTypes, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    photoUrl: "",
    features: {},
    typeId: "",
    isAvailable: true,
    isActive: true,
  });
  const [featureKey, setFeatureKey] = useState("");
  const [featureValue, setFeatureValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Si solo hay un tipo de recurso, seleccionarlo automáticamente
  useEffect(() => {
    if (resourceTypes && resourceTypes.length === 1) {
      setFormData(prev => ({
        ...prev,
        typeId: resourceTypes[0].id.toString()
      }));
    }
  }, [resourceTypes]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError("Por favor, selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño (ejemplo: máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar los 5MB");
        return;
      }

      setImageFile(file);
      setError(""); // Limpiar errores anteriores

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData(prev => ({
      ...prev,
      photoUrl: ""
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
    setError("");

    try {
      // Validaciones del frontend
      if (!formData.name.trim()) {
        throw new Error("El nombre es requerido");
      }

      if (!imageFile && !formData.photoUrl.trim()) {
        throw new Error("Debe seleccionar una imagen o proporcionar una URL");
      }

      if (!formData.typeId) {
        throw new Error("Debe seleccionar un tipo de recurso");
      }

      let finalPhotoUrl = formData.photoUrl;

      // Si hay una imagen seleccionada, subirla a Cloudinary
      if (imageFile) {
        try {
          finalPhotoUrl = await uploadReosurseImage(imageFile);
        } catch (uploadError) {
          throw new Error("Error al subir la imagen. Por favor, intenta de nuevo.");
        }
      } else if (formData.photoUrl.trim()) {
        // Validar URL de la foto si se proporciona manualmente
        try {
          new URL(formData.photoUrl);
        } catch (urlError) {
          throw new Error("La URL de la foto no es válida");
        }
      }

      const resourceData = {
        name: formData.name.trim(),
        photoUrl: finalPhotoUrl,
        features: formData.features,
        typeId: parseInt(formData.typeId),
        isAvailable: true, // Siempre disponible al crear
        isActive: true, // Siempre activo al crear
      };

      const newResource = await createResourceApi(resourceData);

      // Limpiar formulario
      setFormData({
        name: "",
        photoUrl: "",
        features: {},
        typeId: "",
        isAvailable: true,
        isActive: true,
      });
      setFeatureKey("");
      setFeatureValue("");
      setImageFile(null);
      setImagePreview("");

      // Notificar éxito al componente padre
      if (onSuccess) {
        onSuccess(newResource);
      }
    } catch (err) {
      setError(err.message || "Error al crear el recurso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-resource-form">
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
        <div className="form-hint">
          Nombre descriptivo y único para identificar el recurso
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Imagen del Recurso *
        </label>
        
        {/* Selector de archivo */}
        <div className="image-upload-section">
          <label htmlFor="imageUpload" className="image-upload-label">
            <div className="image-upload-placeholder">
              <svg className="upload-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Seleccionar imagen</span>
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageChange}
                className="image-upload-input"
                disabled={loading}
              />
            </div>
          </label>

          {/* Vista previa de la imagen */}
          {(imagePreview || formData.photoUrl) && (
            <div className="image-preview-container">
              <div className="image-preview">
                <img 
                  src={imagePreview || formData.photoUrl} 
                  alt="Vista previa" 
                  className="preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="image-remove-btn"
                  disabled={loading}
                >
                  ×
                </button>
              </div>
              <div className="image-preview-actions">
                <span className="image-source">
                  {imageFile ? `Archivo: ${imageFile.name}` : 'URL externa'}
                </span>
              </div>
            </div>
          )}

          {/* O URL manual */}
          <div className="url-input-section">
            <label htmlFor="photoUrl" className="url-input-label">
              O ingresa una URL de imagen:
            </label>
            <input
              type="url"
              id="photoUrl"
              name="photoUrl"
              value={formData.photoUrl}
              onChange={handleChange}
              className="form-input url-input"
              placeholder="https://ejemplo.com/foto-recurso.jpg"
              disabled={loading || imageFile}
            />
          </div>
        </div>

        <div className="form-hint">
          Sube una imagen o proporciona una URL. Formatos aceptados: JPG, PNG, GIF. Tamaño máximo: 5MB.
        </div>
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
        <div className="form-hint">
          Selecciona la categoría a la que pertenece este recurso
        </div>
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
          <div className="form-hint">
            Agrega características específicas del recurso (ej: capacidad, modelo, especificaciones técnicas)
          </div>
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
              onChange={(e) => setFormData(prev => ({
                ...prev,
                isAvailable: e.target.checked
              }))}
              className="checkbox-input"
              disabled={loading}
            />
            <span className="checkbox-custom"></span>
            <span className="checkbox-text">Recurso disponible para préstamos</span>
          </label>
        </div>
        <div className="form-hint">
          Si está desmarcado, el recurso no podrá ser reservado temporalmente
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
          {loading ? "Creando..." : "Crear Recurso"}
        </button>
      </div>
    </form>
  );
};

export default CreateResourceForm;