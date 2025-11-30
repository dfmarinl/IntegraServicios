import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import {
  getResourceTypesApi,
  deleteResourceTypeApi,
} from "../../../api/Resource/resourceType";
import { getActiveUnitsApi } from "../../../api/unit/units";
// import GenericModal from "../../../modals/GenericModal/GenericModal";
// import CreateResourceTypeForm from "../../../forms/CreateResourceTypeForm/CreateResourceTypeForm";
// import EditResourceTypeForm from "../../../forms/EditResourceTypeForm/EditResourceTypeForm";
// import DeleteConfirmationModal from "../../../modals/DeleteConfirmationModal/DeleteConfirmationModal";
import "./ResourceTypesManagement.css";

const ResourceTypesManagement = () => {
  const [allResourceTypes, setAllResourceTypes] = useState([]);
  const [displayedResourceTypes, setDisplayedResourceTypes] = useState([]);
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResourceType, setSelectedResourceType] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResourceTypes, setTotalResourceTypes] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const limit = 6;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isSearching || selectedUnitFilter) {
      handleSearchAndFilter();
    } else {
      loadPaginatedResourceTypes();
    }
  }, [currentPage, searchTerm, selectedUnitFilter, isSearching]);

  const loadInitialData = async () => {
    try {
      setError(null);
      // Cargar todas las unidades para el filtro
      const unitsData = await getActiveUnitsApi();
      setAllUnits(unitsData);

      // Cargar todos los tipos de recurso para búsqueda
      const resourceTypesData = await getResourceTypesApi();
      setAllResourceTypes(resourceTypesData);

      // Cargar primera página paginada
      await loadPaginatedResourceTypes();
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadPaginatedResourceTypes = async () => {
    if (isSearching || selectedUnitFilter) return;

    try {
      // En una implementación real, tendrías un endpoint paginado
      // Por ahora simulamos la paginación en frontend
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = allResourceTypes.slice(startIndex, endIndex);

      setDisplayedResourceTypes(paginatedData);
      setTotalPages(Math.ceil(allResourceTypes.length / limit));
      setTotalResourceTypes(allResourceTypes.length);
    } catch (err) {
      console.error("Error al cargar tipos de recurso paginados:", err);
      setError("Error al cargar los tipos de recurso");
    }
  };

  const handleSearchAndFilter = () => {
    let filtered = allResourceTypes;

    // Aplicar filtro por unidad
    if (selectedUnitFilter) {
      filtered = filtered.filter(
        (resourceType) => resourceType.unitId === parseInt(selectedUnitFilter)
      );
    }

    // Aplicar búsqueda por nombre
    if (searchTerm) {
      filtered = filtered.filter((resourceType) =>
        resourceType.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Paginación para resultados filtrados
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    setDisplayedResourceTypes(paginatedData);
    setTotalResourceTypes(filtered.length);
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

  const handleUnitFilterChange = (unitId) => {
    setSelectedUnitFilter(unitId);
    setIsSearching(true);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedUnitFilter("");
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handlers para modales - COMENTADOS TEMPORALMENTE
  const handleEdit = (resourceType) => {
    setSelectedResourceType(resourceType);
    setIsEditModalOpen(true);
    console.log("Editar tipo de recurso:", resourceType);
    alert(
      `Funcionalidad de edición para "${resourceType.name}" - En desarrollo`
    );
  };

  const handleDeleteClick = (resourceType) => {
    setSelectedResourceType(resourceType);
    setIsDeleteModalOpen(true);
    console.log("Eliminar tipo de recurso:", resourceType);

    // Simulación temporal de eliminación
    if (
      confirm(`¿Estás seguro de que quieres eliminar "${resourceType.name}"?`)
    ) {
      handleDeleteConfirm(resourceType);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedResourceType(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedResourceType(null);
  };

  const handleCreateSuccess = (newResourceType) => {
    setIsCreateModalOpen(false);
    loadInitialData();
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = (updatedResourceType) => {
    setIsEditModalOpen(false);
    setSelectedResourceType(null);
    loadInitialData();
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
      loadInitialData();
    } catch (err) {
      console.error("Error al eliminar tipo de recurso:", err);
      setError(err.message || "Error al eliminar el tipo de recurso");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Estadísticas
  const managementCards = [
    {
      title: "Tipos de Recurso",
      value: allResourceTypes.length,
      icon: "📋",
      color: "#2563eb",
      description: "Total de tipos en el sistema",
    },
    {
      title: "Unidades Activas",
      value: allUnits.length,
      icon: "🏛️",
      color: "#16a34a",
      description: "Unidades con tipos de recurso",
    },
    {
      title: "Tipos Recientes",
      value: allResourceTypes.filter((type) => {
        const createdDate = new Date(type.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length,
      icon: "🆕",
      color: "#ea580c",
      description: "Creados en los últimos 7 días",
    },
  ];

  const actionCards = [
    {
      title: "Crear Nuevo Tipo",
      description: "Registrar un nuevo tipo de recurso",
      icon: "➕",
      onClick: () => {
        setIsCreateModalOpen(true);
        alert("Funcionalidad de creación - En desarrollo");
      },
      color: "#10b981",
    },
  ];

  if (loading && displayedResourceTypes.length === 0) {
    return <div className="loading">Cargando tipos de recurso...</div>;
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
    <div className="resource-types-management">
      <h1 className="page-title">Gestión de Tipos de Recurso</h1>
      <p className="page-subtitle">
        Administra los tipos de recursos disponibles en las unidades
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

      {/* Lista de tipos de recurso con búsqueda y filtros */}
      <div className="resource-types-overview">
        <div className="resource-types-header">
          <div className="resource-types-title-section">
            <h2>Tipos de Recurso Existentes</h2>

            {/* Filtros y búsqueda */}
            <div className="filters-container">
              <form onSubmit={handleSearch} className="search-container">
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

              <div className="filter-group">
                <select
                  value={selectedUnitFilter}
                  onChange={(e) => handleUnitFilterChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Todas las unidades</option>
                  {allUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm || selectedUnitFilter) && (
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
        {(searchTerm || selectedUnitFilter) && (
          <div className="search-info">
            <p>
              {displayedResourceTypes.length} resultado(s)
              {searchTerm && ` para "${searchTerm}"`}
              {selectedUnitFilter &&
                ` en unidad "${
                  allUnits.find((u) => u.id === parseInt(selectedUnitFilter))
                    ?.name
                }"`}
            </p>
          </div>
        )}

        <div className="resource-types-list">
          {displayedResourceTypes.map((resourceType) => {
            const unit = allUnits.find((u) => u.id === resourceType.unitId);
            return (
              <Card key={resourceType.id} className="resource-type-card">
                <div className="resource-type-header">
                  <h3>{resourceType.name}</h3>
                  <span className="resource-type-id">
                    ID: {resourceType.id}
                  </span>
                </div>

                <div className="resource-type-description">
                  <p>{resourceType.description || "Sin descripción"}</p>
                </div>

                <div className="resource-type-meta">
                  <div className="resource-type-unit">
                    <strong>Unidad:</strong> {unit?.name || "No asignada"}
                  </div>
                  {resourceType.maxBookingHours && (
                    <div className="resource-type-limit">
                      <strong>Límite de reserva:</strong>{" "}
                      {resourceType.maxBookingHours} horas
                    </div>
                  )}
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
                  <button
                    className="btn-outline"
                    onClick={() => handleEdit(resourceType)}
                  >
                    Editar
                  </button>
                </div>
                <div className="resource-type-danger-actions">
                  <button
                    className="btn-danger-outline"
                    onClick={() => handleDeleteClick(resourceType)}
                  >
                    Eliminar Tipo
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
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

      {/* Modales - COMENTADOS TEMPORALMENTE */}
      {/* <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nuevo Tipo de Recurso"
        subtitle="Complete los datos para registrar un nuevo tipo de recurso"
        size="medium"
      >
        <CreateResourceTypeForm
          units={allUnits}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal>

      <GenericModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Tipo de Recurso"
        subtitle={`Modifique los datos de ${selectedResourceType?.name}`}
        size="medium"
      >
        <EditResourceTypeForm
          resourceType={selectedResourceType}
          units={allUnits}
          onSuccess={handleEditSuccess}
          onCancel={handleCloseEditModal}
        />
      </GenericModal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        item={selectedResourceType}
        itemType="tipo de recurso"
        loading={deleteLoading}
      /> */}
    </div>
  );
};

export default ResourceTypesManagement;
