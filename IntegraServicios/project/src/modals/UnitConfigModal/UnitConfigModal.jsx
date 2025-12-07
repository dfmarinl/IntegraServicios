import React from "react";
import "./UnitConfigModal.css";
import GlobalScheduleConfig from "../../components/admin/GlobalScheduleConfig/GlobalScheduleConfig";

const UnitConfigModal = ({ unit, onClose }) => {
  return (
    <div className="unit-config-modal-overlay" onClick={onClose}>
      <div className="unit-config-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="config-modal-header">
          <div className="config-modal-title">
            <h2>⏰ Configurar Horario Global</h2>
            <p className="unit-name">{unit?.name}</p>
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
              Configura los días y horarios de operación de la unidad
            </p>
          </div>

          <div className="content-body">
            <GlobalScheduleConfig unit={unit} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitConfigModal;
