import React, { useState } from "react";
import "./ResourceConfigModal.css";
import TypeScheduleConfig from "../../components/admin/TypeScheduleConfig/TypeScheduleConfig";

const ResourceConfigModal = ({ resourceType, onClose }) => {
  const [activeSection, setActiveSection] = useState("horarios");

  const menuOptions = [
    { id: "horarios", label: "Horario Específico", icon: "⏰" },
    { id: "configuracion", label: "Configuración", icon: "⚙️" },
    { id: "recursos", label: "Recursos Asociados", icon: "🛋️" },
    { id: "disponibilidad", label: "Disponibilidad", icon: "✅" },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "horarios":
        return <TypeScheduleConfig resourceType={resourceType} />;
      case "configuracion":
        return <ConfiguracionContent resourceType={resourceType} />;
      case "recursos":
        return <RecursosContent resourceType={resourceType} />;
      case "disponibilidad":
        return <DisponibilidadContent resourceType={resourceType} />;
      default:
        return <DefaultContent />;
    }
  };

  return (
    <div className="resource-config-modal-overlay">
      <div className="resource-config-modal">
        {/* Header */}
        <div className="config-modal-header">
          <div className="config-modal-title">
            <h2>⚙️ Configurar Tipo de Recurso</h2>
            <div className="resource-info">
              <p className="resource-name">{resourceType?.name}</p>
              <span className="resource-unit">Unidad: {resourceType?.unit?.name}</span>
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
                {getSectionDescription(activeSection, resourceType)}
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

const ConfiguracionContent = ({ resourceType }) => (
  <div className="construction-content">
    <div className="construction-icon">⚙️</div>
    <h3>Configuración del Tipo de Recurso</h3>
    <p>
      Configura los detalles de: <strong>{resourceType?.name}</strong>
    </p>
    <div className="resource-details">
      <div className="detail-item">
        <label>Nombre:</label>
        <span>{resourceType?.name}</span>
      </div>
      <div className="detail-item">
        <label>Descripción:</label>
        <span>{resourceType?.description || "Sin descripción"}</span>
      </div>
      <div className="detail-item">
        <label>Granularidad:</label>
        <span>{resourceType?.granularity} minutos</span>
      </div>
      <div className="detail-item">
        <label>Estado:</label>
        <span className={`status ${resourceType?.isActive ? 'active' : 'inactive'}`}>
          {resourceType?.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
    <p>Próximamente podrás editar estas configuraciones.</p>
  </div>
);

const RecursosContent = ({ resourceType }) => (
  <div className="construction-content">
    <div className="construction-icon">🛋️</div>
    <h3>Recursos Asociados</h3>
    <p>
      Gestiona los recursos individuales del tipo: <strong>{resourceType?.name}</strong>
    </p>
    <p>Próximamente podrás ver y administrar los recursos específicos de este tipo.</p>
  </div>
);

const DisponibilidadContent = ({ resourceType }) => (
  <div className="construction-content">
    <div className="construction-icon">✅</div>
    <h3>Disponibilidad Específica</h3>
    <p>
      Configura disponibilidad avanzada para: <strong>{resourceType?.name}</strong>
    </p>
    <p>
      Próximamente podrás definir excepciones, bloqueos y reglas específicas de disponibilidad.
    </p>
  </div>
);

// Helper function para descripciones
const getSectionDescription = (section, resourceType) => {
  const descriptions = {
    horarios: `Configura los horarios específicos para ${resourceType?.name} (dentro del horario de la unidad)`,
    configuracion: "Gestiona la configuración básica del tipo de recurso",
    recursos: "Administra los recursos individuales asociados a este tipo",
    disponibilidad: "Define reglas específicas de disponibilidad y excepciones",
  };
  return descriptions[section] || "Configura los ajustes del tipo de recurso";
};

export default ResourceConfigModal;