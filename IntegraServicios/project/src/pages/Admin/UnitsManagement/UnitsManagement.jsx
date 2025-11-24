import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import {
  getUnitsApi,
  getUnitsPaginatedApi,
  deleteUnitApi,
} from "../../../api/unit/units";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import CreateUnitForm from "../../../forms/CreateUnitForm/CreateUnitForm";
import EditUnitForm from "../../../forms/EditUnitForm/EditUnitForm";
import DeleteConfirmationModal from "../../../modals/DeleteConfirmationModal/DeleteConfirmationModal";
import UnitConfigModal from "../../../modals/UnitConfigModal/UnitConfigModal";
import "./UnitsManagement.css";

const UnitsManagement = () => {
  const [allUnits, setAllUnits] = useState([]); // Para búsqueda
  const [displayedUnits, setDisplayedUnits] = useState([]); // Unidades a mostrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUnits, setTotalUnits] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const limit = 6; // Unidades por página

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isSearching) {
      // Cuando hay búsqueda, filtrar en frontend
      handleSearchInFrontend();
    } else {
      // Cuando no hay búsqueda, cargar página paginada
      loadPaginatedUnits();
    }
  }, [currentPage, searchTerm, isSearching]);

  const loadInitialData = async () => {
    try {
      setError(null);
      // Cargar todas las unidades para búsqueda
      const allUnitsData = await getUnitsApi();
      setAllUnits(allUnitsData);

      // Cargar primera página paginada
      await loadPaginatedUnits();
    } catch (err) {
      console.error("Error al cargar unidades:", err);
      setError("Error al cargar las unidades");
    } finally {
      setLoading(false);
    }
  };

  const loadPaginatedUnits = async () => {
    if (isSearching) return; // No cargar paginación si estamos buscando

    try {
      const response = await getUnitsPaginatedApi(currentPage, limit);
      setDisplayedUnits(response.units);
      setTotalPages(response.totalPages);
      setTotalUnits(response.total);
    } catch (err) {
      console.error("Error al cargar unidades paginadas:", err);
      setError("Error al cargar las unidades");
    }
  };

  const handleSearchInFrontend = () => {
    if (!searchTerm) {
      // Si no hay término de búsqueda, volver a paginación
      setIsSearching(false);
      setCurrentPage(1);
      return;
    }

    // Filtrar unidades en frontend
    const filtered = allUnits.filter((unit) =>
      unit.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setDisplayedUnits(filtered);
    setTotalUnits(filtered.length);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Mantener todas las funciones existentes
  const handleConfigure = (unit) => {
    setSelectedUnit(unit);
    setIsConfigModalOpen(true);
  };

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (unit) => {
    setSelectedUnit(unit);
    setIsDeleteModalOpen(true);
  };

  const handleCloseConfigModal = () => {
    setIsConfigModalOpen(false);
    setSelectedUnit(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUnit(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUnit(null);
  };

  const handleCreateSuccess = (newUnit) => {
    setIsCreateModalOpen(false);
    loadInitialData(); // Recargar todo
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = (updatedUnit) => {
    setIsEditModalOpen(false);
    setSelectedUnit(null);
    loadInitialData(); // Recargar todo
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedUnit(null);
  };

  const handleDeleteConfirm = async (unit) => {
    setDeleteLoading(true);
    try {
      await deleteUnitApi(unit.id);
      setIsDeleteModalOpen(false);
      setSelectedUnit(null);
      loadInitialData(); // Recargar todo
    } catch (err) {
      console.error("Error al eliminar unidad:", err);
      setError(err.message || "Error al eliminar la unidad");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Actualizar managementCards
  const managementCards = [
    {
      title: "Unidades Activas",
      value: allUnits.length, // Usar todas las unidades para el total
      icon: "🏛️",
      color: "#2563eb",
      description: "Total de unidades en el sistema",
    },
    {
      title: "Granularidad Promedio",
      value:
        allUnits.length > 0
          ? `${Math.round(
              allUnits.reduce((sum, unit) => sum + unit.granularity, 0) /
                allUnits.length
            )} min`
          : "0 min",
      icon: "⏱️",
      color: "#16a34a",
      description: "Tiempo mínimo promedio de préstamo",
    },
    {
      title: "Unidades Recientes",
      value: allUnits.filter((unit) => {
        const createdDate = new Date(unit.createdAt);
        const today = new Date();
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }).length,
      icon: "🆕",
      color: "#ea580c",
      description: "Creadas en los últimos 7 días",
    },
  ];

  const actionCards = [
    {
      title: "Crear Nueva Unidad",
      description: "Registrar una nueva unidad de servicios",
      icon: "➕",
      onClick: () => setIsCreateModalOpen(true),
      color: "#10b981",
    },
  ];

  if (loading && displayedUnits.length === 0) {
    return <div className="loading">Cargando unidades...</div>;
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
    <div className="units-management">
      <h1 className="page-title">Gestión de Unidades</h1>
      <p className="page-subtitle">
        Administra las unidades de servicios, sus horarios y recursos
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

      {/* Acción de Crear Nueva Unidad */}
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

      {/* Lista de unidades con búsqueda y paginación */}
      <div className="units-overview">
        <div className="units-header">
          <div className="units-title-section">
            <h2>Unidades Existentes</h2>
            {/* Barra de búsqueda - Ahora a la izquierda y más grande */}
            <form onSubmit={handleSearch} className="search-container">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Buscar unidades por nombre..."
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
        </div>

        {/* Información de resultados */}
        {searchTerm && (
          <div className="search-info">
            <p>
              {displayedUnits.length} resultado(s) para "{searchTerm}"
              {isSearching && " (búsqueda en todas las unidades)"}
            </p>
          </div>
        )}

        <div className="units-list">
          {displayedUnits.map((unit) => (
            <Card key={unit.id} className="unit-card">
              <div className="unit-header">
                <h3>{unit.name}</h3>
                <span className="unit-id">ID: {unit.id}</span>
              </div>
              <div className="unit-description">
                <p>{unit.description}</p>
              </div>
              <div className="unit-stats">
                <div className="unit-stat">
                  <span className="stat-number">{unit.granularity}</span>
                  <span className="stat-label">minutos</span>
                </div>
                <div className="unit-stat">
                  <span className="stat-number">
                    {new Date(unit.createdAt).toLocaleDateString()}
                  </span>
                  <span className="stat-label">Fecha de creación</span>
                </div>
                <div className="unit-stat">
                  <span
                    className={`status-badge ${
                      unit.isActive ? "active" : "inactive"
                    }`}
                  >
                    {unit.isActive ? "Activa" : "Inactiva"}
                  </span>
                  <span className="stat-label">Estado</span>
                </div>
              </div>
              <div className="unit-actions">
                <button
                  className="btn-outline"
                  onClick={() => handleEdit(unit)}
                >
                  Editar
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleConfigure(unit)}
                >
                  Configurar
                </button>
              </div>
              <div className="unit-danger-actions">
                <button
                  className="btn-danger-outline"
                  onClick={() => handleDeleteClick(unit)}
                >
                  Eliminar Unidad
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Paginación - Solo mostrar cuando no hay búsqueda */}
        {!isSearching && totalPages > 1 && (
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

      {/* Modales */}
      <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nueva Unidad"
        subtitle="Complete los datos para registrar una nueva unidad"
        size="medium"
      >
        <CreateUnitForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal>

      <GenericModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Unidad"
        subtitle={`Modifique los datos de ${selectedUnit?.name}`}
        size="medium"
      >
        <EditUnitForm
          unit={selectedUnit}
          onSuccess={handleEditSuccess}
          onCancel={handleCloseEditModal}
        />
      </GenericModal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        unit={selectedUnit}
        loading={deleteLoading}
      />

      {/* NUEVO: Modal de Configuración de Unidad */}
      {isConfigModalOpen && (
        <UnitConfigModal unit={selectedUnit} onClose={handleCloseConfigModal} />
      )}
    </div>
  );
};

export default UnitsManagement;
