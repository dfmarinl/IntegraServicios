import { useState, useEffect } from "react";
import Card from "../../../components/common/Card";
// NOTA: Estos imports necesitarán ser creados posteriormente
// import {
//   getActiveUsersApi,
//   getUsersPaginatedApi,
//   deleteUserApi,
// } from "../../../api/user/users";
import GenericModal from "../../../modals/GenericModal/GenericModal";
import GenericDeleteModal from "../../../modals/GenericDeleteModal/GenericDeleteModal";
// NOTA: Estos componentes de formulario necesitarán ser creados posteriormente
// import CreateUserForm from "../../../forms/CreateUserForm/CreateUserForm";
// import EditUserForm from "../../../forms/EditUserForm/EditUserForm";
import "./UsersManagement.css";

const UsersManagement = () => {
  const [allUsers, setAllUsers] = useState([]); // Para búsqueda
  const [displayedUsers, setDisplayedUsers] = useState([]); // Usuarios a mostrar
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Estados para búsqueda, filtros y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // 'all', 'estudiante', 'profesor', 'empleado', 'administrador'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const limit = 8;

  // Datos de ejemplo para visualización (eliminar cuando tengas los endpoints reales)
  const mockUsers = [
    {
      id: 1,
      firstName: "Juan",
      lastName: "Pérez",
      email: "juan.perez@email.com",
      identificationNumber: "12345678",
      age: 25,
      city: "Bogotá",
      direction: "Calle 123 #45-67",
      rol: "estudiante",
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      firstName: "María",
      lastName: "González",
      email: "maria.gonzalez@email.com",
      identificationNumber: "87654321",
      age: 35,
      city: "Medellín",
      direction: "Carrera 80 #12-34",
      rol: "profesor",
      isActive: true,
      createdAt: "2024-01-10",
    },
    {
      id: 3,
      firstName: "Carlos",
      lastName: "Rodríguez",
      email: "carlos.rodriguez@universidad.edu",
      identificationNumber: "11223344",
      age: 42,
      city: "Cali",
      direction: "Avenida 5 #23-45",
      rol: "empleado",
      isActive: true,
      createdAt: "2024-01-05",
    },
    {
      id: 4,
      firstName: "Ana",
      lastName: "Martínez",
      email: "ana.martinez@admin.edu",
      identificationNumber: "55667788",
      age: 38,
      city: "Barranquilla",
      direction: "Calle 70 #15-20",
      rol: "administrador",
      isActive: true,
      createdAt: "2024-01-01",
    },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (isSearching || roleFilter !== "all") {
      handleSearchAndFilter();
    } else {
      loadPaginatedUsers();
    }
  }, [currentPage, searchTerm, roleFilter, isSearching]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // NOTA: Reemplazar con llamada real a la API
      // const usersData = await getActiveUsersApi();
      // setAllUsers(usersData);

      // Usando datos de ejemplo por ahora
      setAllUsers(mockUsers);

      await loadPaginatedUsers();
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadPaginatedUsers = async () => {
    if (isSearching || roleFilter !== "all") return;

    try {
      // NOTA: Reemplazar con llamada real a la API
      // const response = await getUsersPaginatedApi(currentPage, limit);
      // setDisplayedUsers(response.users);
      // setTotalPages(response.totalPages);
      // setTotalUsers(response.total);

      // Simulación de paginación con datos de ejemplo
      const startIndex = (currentPage - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = mockUsers.slice(startIndex, endIndex);

      setDisplayedUsers(paginatedData);
      setTotalPages(Math.ceil(mockUsers.length / limit));
      setTotalUsers(mockUsers.length);
    } catch (err) {
      console.error("Error al cargar usuarios paginados:", err);
      setError("Error al cargar los usuarios");
    }
  };

  const handleSearchAndFilter = () => {
    let filtered = allUsers;

    // Aplicar filtro por rol
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.rol === roleFilter);
    }

    // Aplicar búsqueda por nombre, email o identificación
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.identificationNumber.includes(searchTerm)
      );
    }

    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    setDisplayedUsers(paginatedData);
    setTotalUsers(filtered.length);
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

  const handleRoleFilterChange = (role) => {
    setRoleFilter(role);
    setIsSearching(true);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setRoleFilter("all");
    setSearchInput("");
    setSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Handlers para modales
  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const handleCreateSuccess = (newUser) => {
    setIsCreateModalOpen(false);
    loadInitialData(); // Recargar la lista
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = (updatedUser) => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    loadInitialData(); // Recargar la lista
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async (user) => {
    setDeleteLoading(true);
    try {
      // NOTA: Reemplazar con llamada real a la API
      // await deleteUserApi(user.id);
      console.log("Eliminar usuario:", user.id);

      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      await loadInitialData(); // Recargar la lista
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setError(err.message || "Error al eliminar el usuario");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Estadísticas por rol
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
      title: "Profesores",
      value: allUsers.filter((user) => user.rol === "profesor").length,
      icon: "👨‍🏫",
      color: "#ea580c",
      description: "Usuarios con rol profesor",
      filter: "profesor",
    },
    {
      title: "Empleados",
      value: allUsers.filter((user) => user.rol === "empleado").length,
      icon: "👨‍💼",
      color: "#7c3aed",
      description: "Personal administrativo",
      filter: "empleado",
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
        Administra todos los usuarios del sistema: estudiantes, profesores,
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
                  value={roleFilter}
                  onChange={(e) => handleRoleFilterChange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los roles</option>
                  <option value="estudiante">Estudiantes</option>
                  <option value="profesor">Profesores</option>
                  <option value="empleado">Empleados</option>
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
        {(searchTerm || roleFilter !== "all") && (
          <div className="search-info">
            <p>
              {displayedUsers.length} resultado(s)
              {searchTerm && ` para "${searchTerm}"`}
              {roleFilter !== "all" && ` en rol "${roleFilter}"`}
              {(searchTerm || roleFilter !== "all") &&
                " (búsqueda en todos los usuarios)"}
            </p>
          </div>
        )}

        <div className="users-list">
          {displayedUsers.map((user) => (
            <Card key={user.id} className="user-card">
              <div className="user-header">
                <h3>
                  {user.firstName} {user.lastName}
                </h3>
                <div className="user-badges">
                  <span className={`role-badge role-${user.rol}`}>
                    {user.rol}
                  </span>
                  <span className="user-id">ID: {user.id}</span>
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
                {user.age && (
                  <p>
                    <strong>Edad:</strong> {user.age} años
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
                >
                  Eliminar Usuario
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Mensaje cuando no hay resultados */}
        {displayedUsers.length === 0 && !loading && (
          <div className="no-results">
            <p>No se encontraron usuarios</p>
          </div>
        )}

        {/* Paginación - Solo mostrar cuando no hay búsqueda ni filtro */}
        {!isSearching && roleFilter === "all" && totalPages > 1 && (
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

      {/* Modal de Creación - COMENTADO TEMPORALMENTE */}
      {/* <GenericModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateCancel}
        title="Crear Nuevo Usuario"
        subtitle="Complete los datos para registrar un nuevo usuario"
        size="medium"
      >
        <CreateUserForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      </GenericModal> */}

      {/* Modal de Edición - COMENTADO TEMPORALMENTE */}
      {/* <GenericModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Editar Usuario"
        subtitle={`Modifique los datos de ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        size="medium"
      >
        <EditUserForm
          user={selectedUser}
          onSuccess={handleEditSuccess}
          onCancel={handleCloseEditModal}
        />
      </GenericModal> */}

      {/* Modal de Eliminación */}
      <GenericDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteConfirm}
        item={selectedUser}
        loading={deleteLoading}
        title="Eliminar Usuario"
        itemName="usuario"
        warningMessage={
          selectedUser?.rol === "empleado" ||
          selectedUser?.rol === "administrador"
            ? "Este usuario tiene privilegios administrativos. ¿Está seguro de eliminarlo?"
            : "Esta acción eliminará permanentemente al usuario del sistema."
        }
        confirmButtonText="Sí, Eliminar"
        cancelButtonText="Cancelar"
      />
    </div>
  );
};

export default UsersManagement;
