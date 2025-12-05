const { User } = require("../../../../../models");
const bcrypt = require("bcrypt");

// Crear usuario
const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      identificationNumber,
      age,
      email,
      password,
      rol,
      city,
      direction,
      unitId,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !identificationNumber ||
      !age ||
      !email ||
      !password ||
      !city ||
      !direction
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Encrypt password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      identificationNumber,
      age,
      email,
      password: hashedPassword,
      rol: rol || "estudiante",
      city,
      direction,
      unitId: unitId || null,
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: "Error creating user: " + error.message });
  }
};

// Obtener usuarios paginados (SOLO ACTIVOS)
const getUsersPages = async (req, res) => {
  try {
    const { page = 1, limit = 10, role = "", search = "" } = req.query;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const whereClause = { isActive: true }; // ← SOLO USUARIOS ACTIVOS

    if (role && role !== "all") {
      whereClause.rol = role;
    }

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { identificationNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ["password"] },
      where: whereClause, // ← Aplicar filtro
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [["id", "DESC"]],
    });

    res.status(200).json({
      users,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(400).json({ message: "Error getting users: " + error.message });
  }
};

// Obtener TODOS los usuarios (incluye inactivos)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [
        ["isActive", "DESC"], // ← Activos primero
        ["lastName", "ASC"],
      ],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(400).json({ message: "Error getting users: " + error.message });
  }
};

// Obtener usuarios ACTIVOS (similar a /active de unidades)
const getActiveUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ["password"] },
      order: [["lastName", "ASC"]],
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting active users:", error);
    res
      .status(400)
      .json({ message: "Error getting active users: " + error.message });
  }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      where: { id },
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(400).json({ message: "Error getting user: " + error.message });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update(data);

    // Excluir password en la respuesta
    const { password, ...userWithoutPassword } = user.toJSON();

    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ message: "Error updating user: " + error.message });
  }
};

// ELIMINACIÓN LÓGICA (desactivar usuario)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Eliminación lógica (desactivar) en lugar de física
    await user.update({ isActive: false });

    res.status(200).json({
      message: "User deactivated successfully",
      user: {
        id: user.id,
        email: user.email,
        isActive: false,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(400).json({ message: "Error deleting user: " + error.message });
  }
};

// Reactivar usuario
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ isActive: true });

    res.status(200).json({
      message: "User activated successfully",
      user: {
        id: user.id,
        email: user.email,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Error activating user:", error);
    res
      .status(400)
      .json({ message: "Error activating user: " + error.message });
  }
};

module.exports = {
  createUser,
  getUsersPages,
  getAllUsers,
  getActiveUsers, // ← NUEVO
  getUserById,
  updateUser,
  deleteUser, // ← Ahora es eliminación lógica
  activateUser, // ← NUEVO
};
