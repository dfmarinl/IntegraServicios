const { User } = require("../../../../../models");
const bcrypt = require("bcrypt");

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
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(400).json({ message: "Error creating user: " + error.message });
  }
};

// Get paginated users
const getUsersPages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ["password"] },
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

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(400).json({ message: "Error getting users: " + error.message });
  }
};

// Get user by ID
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

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update(data);
    res.status(200).json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(400).json({ message: "Error updating user: " + error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(400).json({ message: "Error deleting user: " + error.message });
  }
};

module.exports = {
  createUser,
  getUsersPages,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
