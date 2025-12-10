const { User } = require("../../../../../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sequelize = require("../../../../../config/database"); // Asegúrate de importar sequelize

// User registration
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      identificationNumber,
      age,
      email,
      city,
      direction,
      password,
      rol,
    } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      identificationNumber,
      age,
      email,
      city,
      direction,
      password: hashedPassword,
      rol: rol || "estudiante",
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, rol: newUser.rol },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Respond with user data and token
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        rol: newUser.rol,
        nombre: `${newUser.firstName} ${newUser.lastName}`,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error details:", error);
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};

// User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign(
      { userId: user.id, rol: user.rol },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, firstName: user.firstName, rol: user.rol },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error" });
  }
};

// Get authenticated user data
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Si el usuario tiene unitId, obtener información de la unidad
    let unitData = null;
    if (user.unitId) {
      const [units] = await sequelize.query(
        `SELECT id, name, description, granularity, "isActive" 
         FROM "Units" 
         WHERE id = :unitId AND "isActive" = true`,
        {
          replacements: { unitId: user.unitId },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      unitData = units || null;
    }

    res.status(200).json({
      ...user.toJSON(),
      unit: unitData, // Agregar información de la unidad
      reservations: [],
      activeLoans: [],
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({
      message: "Error getting user data",
      error: error.message,
    });
  }
};

// Verify current password
const verifyCurrentPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password" });

    res.status(200).json({ message: "Password verified successfully" });
  } catch (error) {
    console.error("Password verification error:", error);
    res.status(500).json({ message: "Internal error" });
  }
};

// Update password
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update profile information
const updateProfile = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const {
      firstName,
      lastName,
      identificationNumber,
      age,
      email,
      city,
      direction,
    } = req.body;

    // Basic validations
    if (
      !firstName ||
      !lastName ||
      !identificationNumber ||
      !age ||
      !email ||
      !city ||
      !direction
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new email is already used by another user
    if (email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email },
      });
      if (existingEmail) {
        return res.status(400).json({
          message: "New email already registered by another user",
        });
      }
    }

    // Update allowed fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.identificationNumber = identificationNumber;
    user.age = age;
    user.email = email;
    user.city = city;
    user.direction = direction;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        city: user.city,
        direction: user.direction,
        identificationNumber: user.identificationNumber,
        age: user.age,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send recovery email
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create recovery token with 15min expiration
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    const resetLink = `https://integra-servicios.vercel.app/reset-password?token=${resetToken}`;

    // Transporter configuration (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"IntegraServicios" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Recovery - IntegraServicios",
      html: `
        <h3>Hello ${user.firstName},</h3>
        <p>We received a password reset request. If this wasn't you, please ignore this message.</p>
        <p><a href="${resetLink}" target="_blank">Click here to reset your password</a></p>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Error sending recovery email",
      error: error.message,
    });
  }
};

// Verify token and update password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword)
      return res
        .status(400)
        .json({ message: "Token and new password required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    if (error.name === "TokenExpiredError") {
      return res
        .status(400)
        .json({ message: "Link expired. Request a new one." });
    }
    res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = {
  register,
  login,
  getMe,
  verifyCurrentPassword,
  updatePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
};
