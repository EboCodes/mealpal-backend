const jwt = require("jsonwebtoken");

// Verifies the JWT sent in the Authorization header (format: "Bearer <token>").
// On success, attaches the decoded payload ({ id, role, school }) to req.user.
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, school, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Restricts a route to one or more roles. Must run after verifyToken.
// Usage: requireRole("vendor") or requireRole("vendor", "admin")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized for this action" });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
