import React from "react";
import GenericModal from "../GenericModal/GenericModal";
import "./DeleteConfirmationModal.css";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  unit,
  loading = false,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(unit);
  };

  return (
    <GenericModal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Unidad"
      size="small"
      closeOnOverlayClick={!loading}
    >
      <div className="delete-confirmation-content">
        <div className="warning-icon">⚠️</div>
        <h3 className="warning-title">
          ¿Estás seguro de que deseas eliminar esta unidad?
        </h3>

        <div className="unit-info">
          <p>
            <strong>Unidad:</strong> {unit?.name}
          </p>
          <p>
            <strong>ID:</strong> {unit?.id}
          </p>
        </div>

        <div className="warning-message">
          <p>
            Esta acción desactivará la unidad y no podrá ser utilizada para
            nuevos préstamos.
          </p>
          <p>
            <strong>Nota:</strong> No se puede eliminar una unidad que tenga
            tipos de recurso asociados.
          </p>
        </div>

        <div className="delete-actions">
          <button
            type="button"
            onClick={onClose}
            className="btn-cancel"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-danger"
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </GenericModal>
  );
};

export default DeleteConfirmationModal;
