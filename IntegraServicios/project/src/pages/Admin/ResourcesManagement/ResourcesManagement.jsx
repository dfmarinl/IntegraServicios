import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import {
  getActiveResourcesApi,
  getResourcesPaginatedApi,
  deleteResourceApi,
} from "../../../api/Resource/Resource";
import { getActiveResourceTypesApi } from "../../../api/Resource/resourceType";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import GenericDeleteModal from "../../../modals/GenericDeleteModal/GenericDeleteModal";
import CreateResourceForm from "../../../forms/CreateResourceForm/CreateResourceForm";
import EditResourceForm from "../../../forms/EditResourceForm/EditResourceForm";
import "./ResourcesManagement.css";

const ResourcesManagement = () => {
  const [allResources, setAllResources] = useState([]);
  const [displayedResources, setDisplayedResources] = useState([]);
  const [allResourceTypes, setAllResourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para búsqueda, filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const limit = 6;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isSearching || selectedTypeFilter) {
      handleSearchAndFilter();
    } else {
      loadPaginatedResources();
    }
  }, [currentPage, searchTerm, selectedTypeFilter, isSearching]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const resourceTypesData = await getActiveResourceTypesApi();
      setAllResourceTypes(resourceTypesData);

      const resourcesData = await getActiveResourcesApi();
      setAllResources(resourcesData);

      await loadPaginatedResources();
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadPaginatedResources = async () => {
    if (isSearching || selectedTypeFilter) return;

    try {
      const response = await getResourcesPaginatedApi(currentPage, limit);
      setDisplayedResources(response.resources);
      setTotalPages(response.totalPages);
      setTotalResources(response.total);
    } catch (err) {
      console.error("Error al cargar recursos paginados:", err);
      setError("Error al cargar los recursos");
    }
  };

  const handleSearchAndFilter = () => {
    let filtered = allResources;

    if (selectedTypeFilter) {
      filtered = filtered.filter(
        (resource) => resource.typeId === parseInt(selectedTypeFilter)
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((resource) =>
        resource.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    setDisplayedResources(paginatedData);
    setTotalResources(filtered.length);
    setTotalPages(Math.ceil(filtered.length / limit));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setIsSearching(true);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (typeId) => {
    setSelectedTypeFilter(typeId);
    setIsSearching(true);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedTypeFilter("");
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handlers para modales
  const handleEdit = (resource) => {
    setSelectedResource(resource);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (resource) => {
    setSelectedResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedResource(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedResource(null);
  };

  const handleCreateSuccess = (newResource) => {
    setIsCreateModalOpen(false);
    loadInitialData();
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = (updatedResource) => {
    setIsEditModalOpen(false);
    setSelectedResource(null);
    loadInitialData();
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedResource(null);
  };

  const handleDeleteConfirm = async (resource) => {
    setDeleteLoading(true);
    try {
      await deleteResourceApi(resource.id);
      setIsDeleteModalOpen(false);
      setSelectedResource(null);
      await loadInitialData();
    } catch (err) {
      console.error("Error al eliminar recurso:", err);
      setError(err.message || "Error al eliminar el recurso");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Estadísticas
  const managementCards = [
    {
      title: "Recursos Totales",
      value: allResources.length,
      icon: "🖥️",
      color: "#2563eb",
      description: "Total de recursos en el sistema",
    },
    {
      title: "Tipos Activos",
      value: allResourceTypes.length,
      icon: "📋",
      color: "#16a34a",
      description: "Tipos de recurso disponibles",
    },
    {
      title: "Recursos Disponibles",
      value: allResources.filter(resource => resource.isAvailable).length,
      icon: "✅",
      color: "#ea580c",
      description: "Recursos listos para uso",
    },
  ];

  const actionCards = [
    {
      title: "Crear Nuevo Recurso",
      description: "Registrar un nuevo recurso en el sistema",
      icon: "➕",
      onClick: () => setIsCreateModalOpen(true),
      color: "#10b981",
    },
  ];

  if (loading && displayedResources.length === 0) {
    return <div className="loading">Cargando recursos...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadInitialData} className="btn-retry">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="resources-management">
      <h1 className="page-title">Gestión de Recursos</h1>
      <p className="page-subtitle">
        Administra los recursos disponibles en el sistema
      </p>

      {/* Estadísticas */}
      <div className="stats-grid">
        {managementCards.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <div className="stat-content">
              <div
                className="stat-icon"
                style={{ backgroundColor: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="stat-details">
                <p className="stat-title">{stat.title}</p>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-description">{stat.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Acción de Crear */}
      <div className="management-actions">
        <h2>Acciones de Gestión</h2>
        <div className="actions-grid">
          {actionCards.map((action) => (
            <button
              key={action.title}
              className="action-card"
              onClick={action.onClick}
            >
              <div
                className="action-icon"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <div className="action-details">
                <h3 className="action-title">{action.title}</h3>
                <p className="action-description">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de recursos con búsqueda y filtros */}
      <div className="resources-overview">
        <div className="resources-header">
          <div className="resources-title-section">
            <h2>Recursos Existentes</h2>

            {/* Filtros y búsqueda */}
            <div className="filters-container">
              <form onSubmit={handleSearch} className="search-container">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Buscar recursos por nombre..."
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

              <div className="filter-group">
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => handleTypeFilterChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todos los tipos</option>
                  {allResourceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm || selectedTypeFilter) && (
                <button
                  onClick={handleClearFilters}
                  className="clear-filters-btn"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Información de resultados */}
        {(searchTerm || selectedTypeFilter) && (
          <div className="search-info">
            <p>
              {displayedResources.length} resultado(s)
              {searchTerm && ` para "${searchTerm}"`}
              {selectedTypeFilter &&
                ` en tipo "${
                  allResourceTypes.find((t) => t.id === parseInt(selectedTypeFilter))
                    ?.name
                }"`}
              {(searchTerm || selectedTypeFilter) &&
                " (búsqueda en todos los recursos activos)"}
            </p>
          </div>
        )}

        <div className="resources-list">
          {displayedResources.map((resource) => {
            const resourceType = allResourceTypes.find((t) => t.id === resource.typeId);
            const unit = resourceType?.unit;

            return (
              <Card key={resource.id} className="resource-card">
                <div className="resource-header">
                  <h3>{resource.name}</h3>
                  <span className="resource-id">
                    ID: {resource.id}
                  </span>
                </div>

                <div className="resource-photo">
                  <img 
                    src={resource.photoUrl} 
                    alt={resource.name}
                    className="resource-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>

                <div className="resource-meta">
                  <div className="resource-type">
                    <strong>Tipo:</strong> {resourceType?.name || "No asignado"}
                  </div>

                  <div className="resource-unit">
                    <strong>Unidad:</strong> {unit?.name || "No asignada"}
                  </div>

                  {resource.features && Object.keys(resource.features).length > 0 && (
                    <div className="resource-features">
                      <strong>Características:</strong>
                      <ul className="features-list">
                        {Object.entries(resource.features).map(([key, value]) => (
                          <li key={key}>
                            <span className="feature-key">{key}:</span>
                            <span className="feature-value">{value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="resource-stats">
                  <div className="resource-stat">
                    <span
                      className={`status-badge ${
                        resource.isAvailable ? "available" : "unavailable"
                      }`}
                    >
                      {resource.isAvailable ? "Disponible" : "No disponible"}
                    </span>
                    <span className="stat-label">Disponibilidad</span>
                  </div>
                  <div className="resource-stat">
                    <span
                      className={`status-badge ${
                        resource.isActive ? "active" : "inactive"
                      }`}
                    >
                      {resource.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <span className="stat-label">Estado</span>
                  </div>
                </div>

                {/* ACCIONES - SOLO EDITAR Y ELIMINAR */}
                <div className="resource-actions">
                  <div className="primary-actions">
                    <button
                      className="btn-outline"
                      onClick={() => handleEdit(resource)}
                    >
                      ✏️ Editar
                    </button>
                  </div>
                  <div className="danger-actions">
                    <button
                      className="btn-danger-outline"
                      onClick={() => handleDeleteClick(resource)}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Mensaje cuando no hay resultados */}
        {displayedResources.length === 0 && !loading && (
          <div className="no-results">
            <p>No se encontraron recursos</p>
          </div>
        )}

        {/* Paginación - Solo mostrar cuando no hay búsqueda ni filtro */}
        {!isSearching && !selectedTypeFilter && totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ← Anterior
            </button>

            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nuevo Recurso"
        subtitle="Complete los datos para registrar un nuevo recurso"
        size="medium"
      >
        <CreateResourceForm
          resourceTypes={allResourceTypes}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal>

      {/* Modal de Edición */}
      <GenericModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Recurso"
        subtitle={`Modifique los datos de ${selectedResource?.name}`}
        size="medium"
      >
        <EditResourceForm
          resource={selectedResource}
          resourceTypes={allResourceTypes}
          onSuccess={handleEditSuccess}
          onCancel={handleCloseEditModal}
        />
      </GenericModal>

      {/* Modal de Eliminación */}
      <GenericDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        item={selectedResource}
        loading={deleteLoading}
        title="Eliminar Recurso"
        itemName="recurso"
        warningMessage="Esta acción desactivará el recurso y no podrá ser utilizado para nuevos préstamos."
        confirmButtonText="Sí, Eliminar"
        cancelButtonText="Cancelar"
      />
    </div>
  );
};

export default ResourcesManagement;