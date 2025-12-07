import React, { useState } from "react";
import Button from "../../components/common/Button";
import "./RatingForm.css";

const RatingForm = ({ reservation, onSubmit, onCancel }) => {
  const [ratings, setRatings] = useState({
    scheduleCompliance: 0,
    resourceQuality: 0,
    staffKindness: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [touched, setTouched] = useState({
    scheduleCompliance: false,
    resourceQuality: false,
    staffKindness: false,
  });

  const handleRatingChange = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
    setTouched((prev) => ({ ...prev, [category]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validar que todas las calificaciones tengan un valor
      if (Object.values(ratings).some((rating) => rating === 0)) {
        alert("Por favor califica todas las categorías antes de enviar");
        setSubmitting(false);
        return;
      }

      const ratingData = {
        scheduleCompliance: ratings.scheduleCompliance,
        resourceQuality: ratings.resourceQuality,
        staffKindness: ratings.staffKindness,
        comment: comment.trim() || null,
      };

      await onSubmit(ratingData);
    } catch (error) {
      console.error("Error en el formulario de calificación:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular promedio solo si hay calificaciones
  const hasAllRatings = Object.values(ratings).every((rating) => rating > 0);
  const averageRating = hasAllRatings
    ? (
        (ratings.scheduleCompliance +
          ratings.resourceQuality +
          ratings.staffKindness) /
        3
      ).toFixed(1)
    : 0;

  const renderStars = (category, currentRating) => {
    return (
      <div className="stars-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${currentRating >= star ? "star-active" : ""}`}
            onClick={() => handleRatingChange(category, star)}
            aria-label={`Calificar con ${star} ${
              star === 1 ? "estrella" : "estrellas"
            }`}
            title={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
          >
            {star <= currentRating ? "★" : "☆"}
          </button>
        ))}
        <span className="rating-value">
          {currentRating > 0 ? `${currentRating}/5` : "Sin calificar"}
        </span>
      </div>
    );
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case "scheduleCompliance":
        return "Cumplimiento de Horarios";
      case "resourceQuality":
        return "Calidad del Recurso";
      case "staffKindness":
        return "Amabilidad del Personal";
      default:
        return category;
    }
  };

  const getCategoryDescription = (category) => {
    switch (category) {
      case "scheduleCompliance":
        return "¿El recurso estuvo disponible en el horario acordado?";
      case "resourceQuality":
        return "¿En qué estado se encontraba el recurso?";
      case "staffKindness":
        return "¿Cómo fue la atención del personal?";
      default:
        return "";
    }
  };

  const getCategoryFeedback = (rating) => {
    if (rating === 0) return "";
    switch (rating) {
      case 5:
        return "Excelente";
      case 4:
        return "Muy bien";
      case 3:
        return "Bien";
      case 2:
        return "Regular";
      case 1:
        return "Malo";
      default:
        return "";
    }
  };

  const getAverageFeedback = (average) => {
    if (average === 0) return "";
    if (average >= 4.5) return "Excelente";
    if (average >= 3.5) return "Muy bien";
    if (average >= 2.5) return "Bien";
    if (average >= 1.5) return "Regular";
    return "Malo";
  };

  return (
    <form className="rating-form" onSubmit={handleSubmit}>
      {/* Categorías de calificación */}
      <div className="rating-categories">
        {["scheduleCompliance", "resourceQuality", "staffKindness"].map(
          (category) => (
            <div key={category} className="category-rating">
              <div className="category-header">
                <div className="category-info">
                  <h5 className="category-title">
                    {getCategoryLabel(category)}
                  </h5>
                  <p className="category-description">
                    {getCategoryDescription(category)}
                  </p>
                </div>
                {touched[category] && ratings[category] > 0 && (
                  <div className="category-feedback">
                    <span className="feedback-text">
                      {getCategoryFeedback(ratings[category])}
                    </span>
                  </div>
                )}
              </div>

              <div className="category-stars">
                {renderStars(category, ratings[category])}
              </div>

              {category === "staffKindness" &&
                ratings[category] < 3 &&
                ratings[category] > 0 && (
                  <div className="low-rating-warning">
                    <span className="warning-icon">⚠️</span>
                    <span>
                      ¿Hay algún problema específico con la atención que nos
                      quieras comentar?
                    </span>
                  </div>
                )}
            </div>
          )
        )}
      </div>

      {/* Promedio de calificaciones */}
      {hasAllRatings && (
        <div className="average-rating-section">
          <h4>Tu Calificación Promedio</h4>
          <div className="average-display">
            <div className="average-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`average-star ${
                    averageRating >= star ? "filled" : ""
                  }`}
                >
                  {averageRating >= star ? "★" : "☆"}
                </span>
              ))}
            </div>
            <div className="average-value">
              <span className="average-number">{averageRating}</span>
              <span className="average-max">/5</span>
            </div>
          </div>
          <div className="average-feedback">
            <span className="feedback-text">
              {getAverageFeedback(parseFloat(averageRating))}
            </span>
          </div>
        </div>
      )}

      {/* Comentario */}
      <div className="comment-section">
        <h4>Comentario (Opcional)</h4>
        <p className="comment-instructions">
          Comparte tu experiencia o sugerencias para mejorar nuestro servicio
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escribe aquí tus comentarios, sugerencias o cualquier observación que consideres importante..."
          rows={4}
          maxLength={500}
          className="comment-textarea"
        />
        <div className="comment-counter">
          <span>{comment.length}/500 caracteres</span>
        </div>
      </div>

      {/* Validación de calificaciones */}
      {!hasAllRatings && (
        <div className="validation-warning">
          <span className="warning-icon">⚠️</span>
          <span>Por favor, califica todas las categorías antes de enviar.</span>
        </div>
      )}

      {/* Botones */}
      <div className="rating-form-buttons">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          disabled={submitting || !hasAllRatings}
        >
          {submitting ? "Enviando..." : "Enviar Calificación"}
        </Button>
      </div>

      {/* Información adicional */}
      <div className="rating-disclaimer">
        <p className="disclaimer-text">
          ⓘ Tu calificación nos ayuda a mejorar la calidad de nuestro servicio.
          Esta información será visible para el personal autorizado.
        </p>
      </div>
    </form>
  );
};

export default RatingForm;
