import React from "react";
import "./GenericModal.css";

const GenericModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "medium", // "small", "medium", "large", "xlarge"
  showCloseButton = true,
  closeOnOverlayClick = true,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-container modal-${size}`}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          {showCloseButton && (
            <button
              className="modal-close-btn"
              onClick={handleCloseClick}
              aria-label="Cerrar modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
};

export default GenericModal;
