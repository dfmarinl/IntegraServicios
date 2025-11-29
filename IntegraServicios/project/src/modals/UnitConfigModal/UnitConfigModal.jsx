import React, { useState } from "react";
import "./UnitConfigModal.css";
import GlobalScheduleConfig from "../../components/admin/GlobalScheduleConfig/GlobalScheduleConfig";

const UnitConfigModal = ({ unit, onClose }) => {
  const [activeSection, setActiveSection] = useState("horarios");

  const menuOptions = [
    { id: "horarios", label: "Horario Global", icon: "⏰" },
    { id: "tipos-recurso", label: "Tipos de Recurso", icon: "📦" },
    { id: "recursos", label: "Registrar Recursos", icon: "🛋️" },
    { id: "disponibilidad", label: "Disponibilidad", icon: "✅" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "horarios":
        return <GlobalScheduleConfig unit={unit} />;
      case "tipos-recurso":
        return <TiposRecursoContent unit={unit} />;
      case "recursos":
        return <RecursosContent unit={unit} />;
      case "disponibilidad":
        return <DisponibilidadContent unit={unit} />;
      default:
        return <DefaultContent />;
    }
  };

  return (
    <div className="unit-config-modal-overlay">
      <div className="unit-config-modal">
        {/* Header */}
        <div className="config-modal-header">
          <div className="config-modal-title">
            <h2>⚙️ Configurar Unidad</h2>
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

        <div className="config-modal-body">
          {/* Sidebar */}
          <div className="config-sidebar">
            <nav className="config-nav">
              {menuOptions.map((option) => (
                <button
                  key={option.id}
                  className={`config-nav-item ${
                    activeSection === option.id ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(option.id)}
                >
                  <span className="nav-icon">{option.icon}</span>
                  <span className="nav-label">{option.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="config-content">
            <div className="content-header">
              <h3>
                {menuOptions.find((opt) => opt.id === activeSection)?.label}
              </h3>
              <p className="content-description">
                {getSectionDescription(activeSection)}
              </p>
            </div>

            <div className="content-body">{renderContent()}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="config-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <div className="footer-actions">
            <button className="btn-outline">Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componentes de contenido (provisionales)
const DefaultContent = () => (
  <div className="construction-content">
    <div className="construction-icon">🚧</div>
    <h3>Proceso en Construcción</h3>
    <p>Esta funcionalidad estará disponible próximamente.</p>
  </div>
);

const TiposRecursoContent = ({ unit }) => (
  <div className="construction-content">
    <div className="construction-icon">📦</div>
    <h3>Tipos de Recursos</h3>
    <p>
      Gestiona las categorías de recursos para: <strong>{unit?.name}</strong>
    </p>
    <p>Próximamente podrás crear y editar tipos de recurso.</p>
  </div>
);

const RecursosContent = ({ unit }) => (
  <div className="construction-content">
    <div className="construction-icon">🛋️</div>
    <h3>Registro de Recursos</h3>
    <p>
      Administra los recursos específicos de: <strong>{unit?.name}</strong>
    </p>
    <p>Próximamente podrás agregar y gestionar recursos individuales.</p>
  </div>
);

const DisponibilidadContent = ({ unit }) => (
  <div className="construction-content">
    <div className="construction-icon">✅</div>
    <h3>Disponibilidad de Recursos</h3>
    <p>
      Configura la disponibilidad para: <strong>{unit?.name}</strong>
    </p>
    <p>
      Próximamente podrás definir horarios y restricciones de disponibilidad.
    </p>
  </div>
);

// Helper function para descripciones
const getSectionDescription = (section) => {
  const descriptions = {
    horarios: "Configura los días y horarios de operación de la unidad",
    "tipos-recurso": "Gestiona las categorías y tipos de recursos disponibles",
    recursos: "Registra y administra los recursos específicos de la unidad",
    disponibilidad: "Define la disponibilidad y restricciones de los recursos",
  };
  return descriptions[section] || "Configura los ajustes de la unidad";
};

export default UnitConfigModal;
