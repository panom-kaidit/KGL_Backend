const jwt = require("jsonwebtoken");

// Middleware to verify JWT token and attach user payload to req.user
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided. Please login first." });
  }

  // Expect header format: "Bearer <token>"
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Invalid authorization format. Use: Bearer <token>" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Temporary debug logs
    console.log("[AUTH DEBUG] token payload:", decoded);

    // Attach verified payload to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token. Please login again." });
  }
};

module.exports = authMiddleware;
