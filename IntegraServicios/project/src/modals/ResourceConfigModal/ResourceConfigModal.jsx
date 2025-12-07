import React from "react";
import "./ResourceConfigModal.css";
import TypeScheduleConfig from "../../components/admin/TypeScheduleConfig/TypeScheduleConfig";

const ResourceConfigModal = ({ resourceType, onClose }) => {
  return (
    <div className="resource-config-modal-overlay" onClick={onClose}>
      <div
        className="resource-config-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="config-modal-header">
          <div className="config-modal-title">
            <h2>⏰ Configurar Horario Específico</h2>
            <div className="resource-info">
              <p className="resource-name">{resourceType?.name}</p>
              <span className="resource-unit">
                Unidad: {resourceType?.unit?.name || resourceType?.Unit?.name}
              </span>
            </div>
          </div>
          <button className="config-close-btn" onClick={onClose}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Solo contenido del horario */}
        <div className="config-modal-body-simple">
          <div className="content-header">
            <p className="content-description">
              Configura los horarios específicos para {resourceType?.name}{" "}
              (dentro del horario de la unidad)
            </p>
          </div>

          <div className="content-body">
            <TypeScheduleConfig resourceType={resourceType} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceConfigModal;
