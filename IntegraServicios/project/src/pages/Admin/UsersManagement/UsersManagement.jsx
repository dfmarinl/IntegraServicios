import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
import {
  getUsersPaginatedApi,
  deleteUserApi,
  getActiveUsersApi,
  getAllUsersApi,
  updateUserApi,
} from "../../../api/user/user";
import { getActiveUnitsApi, getUnitApi } from "../../../api/unit/units";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import CreateUserForm from "../../../forms/CreateUserForm/CreateuserForm";
import EditUserForm from "../../../forms/EditUserForm/EditUserForm";
import GenericDeleteModal from "../../../modals/GenericDeleteModal/GenericDeleteModal";
import "./UsersManagement.css";

const UsersManagement = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitNames, setUnitNames] = useState({}); // NUEVO: Para almacenar nombres de unidades
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // NUEVO
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 6;

  useEffect(() => {
    loadInitialData();
    loadUnitsForForm();
  }, []);

  useEffect(() => {
    if (searchTerm || roleFilter !== "all") {
      searchInActiveUsers();
    } else {
      loadPaginatedUsers();
    }
  }, [currentPage, searchTerm, roleFilter]);

  // Cargar nombres de unidades para los usuarios que tienen unitId
  useEffect(() => {
    const loadUnitNames = async () => {
      const unitIds = [
        ...new Set(allUsers.filter((u) => u.unitId).map((u) => u.unitId)),
      ];
      const names = {};

      for (const unitId of unitIds) {
        try {
          const unit = await getUnitApi(unitId);
          names[unitId] = unit.name;
        } catch (err) {
          console.error(`Error al cargar unidad ${unitId}:`, err);
          names[unitId] = `Unidad ${unitId}`;
        }
      }

      setUnitNames(names);
    };

    if (allUsers.length > 0) {
      loadUnitNames();
    }
  }, [allUsers]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const usersData = await getAllUsersApi();
      setAllUsers(usersData);

      await loadPaginatedUsers();
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("Error al cargar los datos de usuarios");
    } finally {
      setLoading(false);
    }
  };

  const loadUnitsForForm = async () => {
    try {
      const unitsData = await getActiveUnitsApi();
      setUnits(unitsData);
    } catch (err) {
      console.error("Error al cargar unidades:", err);
    }
  };

  const loadPaginatedUsers = async () => {
    try {
      if (!searchTerm && roleFilter === "all") {
        const response = await getUsersPaginatedApi(currentPage, limit);
        setDisplayedUsers(response.users);
        setTotalPages(response.totalPages);
        setTotalUsers(response.total);
      }
    } catch (err) {
      console.error("Error al cargar usuarios paginados:", err);
      setError("Error al cargar los usuarios");
    }
  };

  const searchInActiveUsers = async () => {
    try {
      const allActiveUsers = await getActiveUsersApi();
      let filteredUsers = allActiveUsers;

      if (roleFilter !== "all") {
        filteredUsers = filteredUsers.filter((user) => user.rol === roleFilter);
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.identificationNumber.toLowerCase().includes(searchLower)
        );
      }

      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      setDisplayedUsers(paginatedUsers);
      setTotalUsers(filteredUsers.length);
      setTotalPages(Math.ceil(filteredUsers.length / limit));
    } catch (err) {
      console.error("Error en búsqueda:", err);
      setError("Error al buscar usuarios");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setRoleFilter("all");
    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Funciones para modales
  const handleCreateSuccess = (newUser) => {
    setIsCreateModalOpen(false);
    loadInitialData();
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedUser) => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    loadInitialData();
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async (user) => {
    setDeleteLoading(true);
    try {
      await deleteUserApi(user.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await loadInitialData();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setError(err.message || "Error al eliminar el usuario");
    } finally {
      setDeleteLoading(false);
    }
  };

  const userStats = [
    {
      title: "Total Usuarios",
      value: allUsers.length,
      icon: "👥",
      color: "#2563eb",
      description: "Todos los usuarios del sistema",
      filter: "all",
    },
    {
      title: "Estudiantes",
      value: allUsers.filter((user) => user.rol === "estudiante").length,
      icon: "🎓",
      color: "#16a34a",
      description: "Usuarios con rol estudiante",
      filter: "estudiante",
    },
    {
      title: "Docentes",
      value: allUsers.filter((user) => user.rol === "docente").length,
      icon: "👨‍🏫",
      color: "#ea580c",
      description: "Usuarios con rol docente",
      filter: "docente",
    },
    {
      title: "Empleados de Unidad",
      value: allUsers.filter((user) => user.rol === "empleado_unidad").length,
      icon: "🏢",
      color: "#0891b2",
      description: "Empleados asignados a unidades",
      filter: "empleado_unidad",
    },
    {
      title: "Administradores",
      value: allUsers.filter((user) => user.rol === "administrador").length,
      icon: "🔧",
      color: "#dc2626",
      description: "Administradores del sistema",
      filter: "administrador",
    },
  ];

  const actionCards = [
    {
      title: "Crear Nuevo Usuario",
      description: "Registrar un nuevo usuario en el sistema",
      icon: "➕",
      onClick: () => setIsCreateModalOpen(true),
      color: "#10b981",
    },
  ];

  if (loading && displayedUsers.length === 0) {
    return <div className="loading">Cargando usuarios...</div>;
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
    <div className="users-management">
      <h1 className="page-title">Gestión de Usuarios</h1>
      <p className="page-subtitle">
        Administra todos los usuarios del sistema: estudiantes, docentes,
        empleados y administradores
      </p>

      {/* Estadísticas */}
      <div className="stats-grid">
        {userStats.map((stat) => (
          <Card
            key={stat.title}
            className="stat-card"
            onClick={() => handleRoleFilterChange(stat.filter)}
            style={{ cursor: "pointer" }}
          >
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

      {/* Lista de usuarios con búsqueda y filtros */}
      <div className="users-overview">
        <div className="users-header">
          <div className="users-title-section">
            <h2>Usuarios Existentes</h2>

            {/* Filtros y búsqueda */}
            <div className="filters-container">
              <form onSubmit={handleSearch} className="search-container">
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o identificación..."
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
                  {(searchInput || searchTerm) && (
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
                  value={roleFilter}
                  onChange={(e) => handleRoleFilterChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los roles</option>
                  <option value="estudiante">Estudiantes</option>
                  <option value="docente">Docentes</option>
                  <option value="empleado_unidad">Empleados de Unidad</option>
                  <option value="administrador">Administradores</option>
                </select>
              </div>

              {(searchTerm || roleFilter !== "all") && (
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
        <div className="search-info">
          <p>
            {searchTerm || roleFilter !== "all" ? (
              <>
                {displayedUsers.length} resultado(s) encontrado(s)
                {searchTerm && ` para "${searchTerm}"`}
                {roleFilter !== "all" && ` en rol "${roleFilter}"`}
                {" (búsqueda en usuarios activos)"}
              </>
            ) : (
              <>
                Mostrando página {currentPage} de {totalPages}(
                {displayedUsers.length} usuarios de {totalUsers} totales)
              </>
            )}
          </p>
        </div>

        <div className="users-list">
          {displayedUsers.map((user) => (
            <Card key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-header-content">
                  <h3>
                    {user.firstName} {user.lastName}
                  </h3>
                  <div className="user-badges">
                    <span className={`role-badge role-${user.rol}`}>
                      {user.rol.replace("_", " ")}
                    </span>
                    <span className="user-id">ID: {user.id}</span>
                  </div>
                </div>
              </div>

              <div className="user-info">
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Identificación:</strong> {user.identificationNumber}
                </p>
                {user.city && (
                  <p>
                    <strong>Ciudad:</strong> {user.city}
                  </p>
                )}
                {user.unitId && (
                  <p>
                    <strong>Unidad:</strong>{" "}
                    {unitNames[user.unitId] || `Cargando...`}
                  </p>
                )}
              </div>

              <div className="user-stats">
                <div className="user-stat">
                  <span className="stat-number">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <span className="stat-label">Fecha de registro</span>
                </div>
                <div className="user-stat">
                  <span
                    className={`status-badge ${
                      user.isActive ? "active" : "inactive"
                    }`}
                  >
                    {user.isActive ? "Activo" : "Inactivo"}
                  </span>
                  <span className="stat-label">Estado</span>
                </div>
              </div>

              <div className="user-actions">
                <button
                  className="btn-outline"
                  onClick={() => handleEdit(user)}
                >
                  Editar
                </button>
              </div>
              <div className="user-danger-actions">
                <button
                  className="btn-danger-outline"
                  onClick={() => handleDeleteClick(user)}
                  disabled={!user.isActive}
                  title={!user.isActive ? "Usuario ya está inactivo" : ""}
                >
                  {user.isActive ? "Eliminar Usuario" : "Usuario Inactivo"}
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Mensaje cuando no hay resultados */}
        {displayedUsers.length === 0 && !loading && (
          <div className="no-results">
            <p>No se encontraron usuarios con los filtros aplicados</p>
          </div>
        )}

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

      {/* Modal de Creación */}
      <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nuevo Usuario"
        subtitle="Complete los datos para registrar un nuevo usuario en el sistema"
        size="large"
      >
        <CreateUserForm
          units={units}
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal>

      {/* Modal de Edición */}
      <GenericModal
        isOpen={isEditModalOpen}
        onClose={handleEditCancel}
        title="Editar Usuario"
        subtitle={`Modifique los datos de ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        size="large"
      >
        <EditUserForm
          user={selectedUser}
          units={units}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
        />
      </GenericModal>

      {/* Modal de Eliminación - CORREGIDO */}
      <GenericDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        item={selectedUser}
        loading={deleteLoading}
        title="Eliminar Usuario"
        itemName="usuario"
        itemDisplayField="email" // Usar email en lugar de name (que no existe)
        warningMessage="¿Está seguro de eliminar este usuario? El usuario ya no podrá acceder al sistema."
        confirmButtonText="Sí, Eliminar"
        cancelButtonText="Cancelar"
      />
    </div>
  );
};

export default UsersManagement;
