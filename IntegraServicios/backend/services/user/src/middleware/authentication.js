const jwt = require("jsonwebtoken");

/**
 * Middleware para verificar que el usuario ha enviado un token válido
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ message: "Token requerido" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).json({ message: "Token mal formateado" });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.user = {
      id: decoded.userId, // Mapeo manual
      rol: decoded.rol,
    };
    next();
  });
}

/**
 * Middleware para permitir acceso solo a ciertos roles
 * @param  {...string} roles - lista de roles permitidos
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({
        message:
          "No tienes permisos para realizar esta acción o acceder a esta ruta",
      });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  authorizeRoles,
};
