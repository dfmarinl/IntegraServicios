import React from "react";
import GenericModal from "../GenericModal/GenericModal";
import "./GenericDeleteModal.css";

const GenericDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  loading = false,
  title = "Eliminar",
  itemName = "elemento",
  itemDisplayField = "name",
  warningMessage = "Esta acción no se puede deshacer.",
  additionalWarning = null,
  confirmButtonText = "Sí, Eliminar",
  cancelButtonText = "Cancelar",
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(item);
  };

  const displayName = item?.[itemDisplayField] || itemName;

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayClick={!loading}
    >
      <div className="generic-delete-content">
        <div className="warning-icon">⚠️</div>
        <h3 className="warning-title">
          ¿Estás seguro de que deseas eliminar este(a) {itemName}?
        </h3>

        <div className="item-info">
          <p>
            <strong>{itemName}:</strong> {displayName}
          </p>
          <p>
            <strong>ID:</strong> {item?.id || "N/A"}
          </p>
        </div>

        <div className="warning-message">
          <p>{warningMessage}</p>
          {additionalWarning && <p>{additionalWarning}</p>}
        </div>

        <div className="delete-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-cancel"
            disabled={loading}
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-danger"
            disabled={loading}
          >
            {loading ? "Eliminando..." : confirmButtonText}
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

export default GenericDeleteModal;
