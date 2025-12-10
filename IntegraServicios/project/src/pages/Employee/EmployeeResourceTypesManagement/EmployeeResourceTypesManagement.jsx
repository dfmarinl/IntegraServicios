import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import { getMeApi } from "../../../api/user/auth";
import {
  getActiveResourceTypesApi,
  deleteResourceTypeApi,
} from "../../../api/Resource/resourceType";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import GenericDeleteModal from "../../../modals/GenericDeleteModal/GenericDeleteModal";
import EmployeeCreateResourceTypeForm from "../../../forms/EmployeeCreateResourceTypeForm/EmployeeCreateResourceTypeForm";
import EmployeeEditResourceTypeForm from "../../../forms/EmployeeEditResourceTypeForm/EmployeeEditResourceTypeForm";
import ResourceConfigModal from "../../../modals/ResourceConfigModal/ResourceConfigModal";
import "./EmployeeResourceTypesManagement.css";

const EmployeeResourceTypesManagement = () => {
  const [userData, setUserData] = useState(null);
  const [allResourceTypes, setAllResourceTypes] = useState([]);
  const [displayedResourceTypes, setDisplayedResourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    loadUserAndResourceTypes();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, allResourceTypes]);

  const loadUserAndResourceTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const user = await getMeApi(token);
      setUserData(user);

      if (!user.unitId) {
        setError("No tienes una unidad asignada. Contacta al administrador.");
        setLoading(false);
        return;
      }

      const resourceTypesData = await getActiveResourceTypesApi();

      // Filtrar solo los tipos de recurso de la unidad del empleado
      const filteredByUnit = resourceTypesData.filter(
        (rt) => rt.unitId === user.unitId
      );

      setAllResourceTypes(filteredByUnit);
      setDisplayedResourceTypes(filteredByUnit);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) {
      setDisplayedResourceTypes(allResourceTypes);
      return;
    }

    const filtered = allResourceTypes.filter((resourceType) =>
      resourceType.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setDisplayedResourceTypes(filtered);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  // Handlers para modales
  const handleEdit = (resourceType) => {
    setSelectedResourceType(resourceType);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (resourceType) => {
    setSelectedResourceType(resourceType);
    setIsDeleteModalOpen(true);
  };

  const handleConfigure = (resourceType) => {
    setSelectedResourceType(resourceType);
    setIsConfigModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedResourceType(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedResourceType(null);
  };

  const handleCloseConfigModal = () => {
    setIsConfigModalOpen(false);
    setSelectedResourceType(null);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    loadUserAndResourceTypes();
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedResourceType(null);
    loadUserAndResourceTypes();
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedResourceType(null);
  };

  const handleDeleteConfirm = async (resourceType) => {
    setDeleteLoading(true);
    try {
      await deleteResourceTypeApi(resourceType.id);
      setIsDeleteModalOpen(false);
      setSelectedResourceType(null);
      await loadUserAndResourceTypes();
    } catch (err) {
      console.error("Error al eliminar tipo de recurso:", err);
      setError(err.message || "Error al eliminar el tipo de recurso");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="employee-resource-types-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando tipos de recurso...</p>
        </div>
      </div>
    );
  }

  if (!userData?.unitId) {
    return (
      <div className="employee-resource-types-management">
        <div className="no-unit-container">
          <div className="no-unit-icon">⚠️</div>
          <h2>Sin Unidad Asignada</h2>
          <p>
            No tienes una unidad asignada. Por favor, contacta al administrador.
          </p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="employee-resource-types-management">
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={loadUserAndResourceTypes} className="btn-retry">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-resource-types-management">
      <h1 className="page-title">
        Gestión de Tipos de Recurso -{" "}
        <span className="unit-name">{userData?.unit?.name}</span>
      </h1>
      <p className="page-subtitle">
        Administra los tipos de recursos de tu unidad
      </p>

      {/* Acción de Crear */}
      <div className="create-action">
        <button
          className="btn-create"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <span className="btn-icon">➕</span>
          <span>Crear Nuevo Tipo de Recurso</span>
        </button>
      </div>

      {/* Lista de tipos de recurso con búsqueda */}
      <div className="resource-types-overview">
        <div className="resource-types-header">
          <h2>Tipos de Recurso Existentes</h2>

          {/* Barra de búsqueda */}
          <form onSubmit={handleSearchSubmit} className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Buscar tipos por nombre..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                <svg
                  className="search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="clear-search-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Información de resultados */}
        {searchTerm && (
          <div className="search-info">
            <p>
              {displayedResourceTypes.length} resultado(s) para "{searchTerm}"
            </p>
          </div>
        )}

        <div className="resource-types-list">
          {displayedResourceTypes.map((resourceType) => (
            <Card key={resourceType.id} className="resource-type-card">
              <div className="resource-type-header">
                <h3>{resourceType.name}</h3>
                <span className="resource-type-id">ID: {resourceType.id}</span>
              </div>

              <div className="resource-type-description">
                <p>{resourceType.description || "Sin descripción"}</p>
              </div>

              <div className="resource-type-meta">
                <div className="resource-type-granularity">
                  <strong>Granularidad:</strong> {resourceType.granularity}{" "}
                  minutos
                </div>
              </div>

              <div className="resource-type-stats">
                <div className="resource-type-stat">
                  <span className="stat-number">
                    {new Date(resourceType.createdAt).toLocaleDateString()}
                  </span>
                  <span className="stat-label">Fecha de creación</span>
                </div>
                <div className="resource-type-stat">
                  <span
                    className={`status-badge ${
                      resourceType.isActive ? "active" : "inactive"
                    }`}
                  >
                    {resourceType.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <span className="stat-label">Estado</span>
                </div>
              </div>

              <div className="resource-type-actions">
                <div className="primary-actions">
                  <button
                    className="btn-outline"
                    onClick={() => handleEdit(resourceType)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleConfigure(resourceType)}
                  >
                    ⚙️ Configurar
                  </button>
                </div>
                <div className="danger-actions">
                  <button
                    className="btn-danger-outline"
                    onClick={() => handleDeleteClick(resourceType)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mensaje cuando no hay resultados */}
        {displayedResourceTypes.length === 0 && !loading && (
          <div className="no-results">
            <p>No se encontraron tipos de recurso</p>
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nuevo Tipo de Recurso"
        subtitle={`Para la unidad: ${userData?.unit?.name}`}
        size="medium"
      >
        <EmployeeCreateResourceTypeForm
          unitId={userData?.unitId}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal>

      {/* Modal de Edición */}
      <GenericModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Tipo de Recurso"
        subtitle={`Modifique los datos de ${selectedResourceType?.name}`}
        size="medium"
      >
        <EmployeeEditResourceTypeForm
          resourceType={selectedResourceType}
          onSuccess={handleEditSuccess}
          onCancel={handleCloseEditModal}
        />
      </GenericModal>

      {/* Modal de Configuración */}
      {isConfigModalOpen && selectedResourceType && (
        <ResourceConfigModal
          resourceType={{
            ...selectedResourceType,
            unit: userData?.unit,
          }}
          onClose={handleCloseConfigModal}
        />
      )}

      {/* Modal de Eliminación */}
      <GenericDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        item={selectedResourceType}
        loading={deleteLoading}
        title="Eliminar Tipo de Recurso"
        itemName="tipo de recurso"
        warningMessage="Esta acción desactivará el tipo de recurso y no podrá ser utilizado para nuevos préstamos."
        confirmButtonText="Sí, Eliminar"
        cancelButtonText="Cancelar"
      />
    </div>
  );
};

export default EmployeeResourceTypesManagement;
