import React, { useState, useEffect } from "react";
import { createMultipleResourcesApi } from "../../api/Resource/Resource"; // Cambia a la función múltiple
import { uploadReosurseImage } from "../../api/Resource/ResourceImg";
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
  const [quantity, setQuantity] = useState(1); // Nueva variable para cantidad
  const [featureKey, setFeatureKey] = useState("");
  const [featureValue, setFeatureValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    // Limitar entre 1 y 100
    setQuantity(Math.max(1, Math.min(100, value)));
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
    setSuccessMessage("");

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

      if (quantity < 1 || quantity > 100) {
        throw new Error("La cantidad debe estar entre 1 y 100");
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

      // Crear datos para múltiples recursos
      const resourceData = {
        name: formData.name.trim(),
        photoUrl: finalPhotoUrl,
        features: formData.features,
        typeId: parseInt(formData.typeId),
        quantity: quantity, // Agregar cantidad
        isAvailable: true, // Siempre disponible al crear
        isActive: true, // Siempre activo al crear
      };

      // Usar la nueva API para crear múltiples recursos
      const result = await createMultipleResourcesApi(resourceData);

      // Limpiar formulario
      setFormData({
        name: "",
        photoUrl: "",
        features: {},
        typeId: "",
        isAvailable: true,
        isActive: true,
      });
      setQuantity(1); // Resetear cantidad
      setFeatureKey("");
      setFeatureValue("");
      setImageFile(null);
      setImagePreview("");

      // Mostrar mensaje de éxito
      setSuccessMessage(`✅ ${result.message} - ${result.count} recursos creados`);

      // Notificar éxito al componente padre
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message || "Error al crear los recursos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-resource-form">
      {error && <div className="form-error">{error}</div>}
      {successMessage && <div className="form-success">{successMessage}</div>}

      {/* Campo para cantidad */}
      <div className="form-group">
        <label htmlFor="quantity" className="form-label">
          Cantidad a crear *
        </label>
        <div className="quantity-input-container">
          <input
            type="number"
            id="quantity"
            min="1"
            max="100"
            value={quantity}
            onChange={handleQuantityChange}
            className="form-input quantity-input"
            required
            disabled={loading}
          />
          <div className="quantity-buttons">
            <button
              type="button"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
              className="quantity-btn minus"
              disabled={loading || quantity <= 1}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setQuantity(prev => Math.min(100, prev + 1))}
              className="quantity-btn plus"
              disabled={loading || quantity >= 100}
            >
              +
            </button>
          </div>
        </div>
        <div className="form-hint">
          Número de recursos idénticos a crear. Los nombres serán: "{formData.name || 'Ejemplo'} 1", "{formData.name || 'Ejemplo'} 2", etc.
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Nombre base del recurso *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder="Ej: Silla de oficina, Computadora Dell, etc."
          required
          disabled={loading}
        />
        <div className="form-hint">
          Nombre descriptivo base. Los recursos se crearán con nombres secuenciales
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
          Todos los recursos creados tendrán la misma imagen.
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
          Selecciona la categoría a la que pertenecen estos recursos
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
            Características que compartirán todos los recursos creados (ej: capacidad, modelo, especificaciones técnicas)
          </div>
        </div>

        {/* Lista de características agregadas */}
        {Object.keys(formData.features).length > 0 && (
          <div className="features-list">
            <p className="features-list-title">Características compartidas:</p>
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
            <span className="checkbox-text">Recursos disponibles para préstamos</span>
          </label>
        </div>
        <div className="form-hint">
          Si está desmarcado, los recursos no podrán ser reservados temporalmente
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
          {loading ? "Creando..." : `Crear ${quantity} ${quantity === 1 ? 'Recurso' : 'Recursos'}`}
        </button>
      </div>
    </form>
  );
};

export default CreateResourceForm;