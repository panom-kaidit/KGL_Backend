/**
 * authorizeRole(roles)
 *
 * Accepts a single role string or an array of roles.
 * Allows access only if req.user.role is in the allowed list.
 *
 * FIXED: Previously only accepted a single role string.
 * Multi-role routes (e.g., Manager + Sales-agent can read pricing)
 * required a single call, making it impossible without multiple
 * separate middleware chains.
 *
 * Usage:
 *   authorizeRole("Manager")                        — single role
 *   authorizeRole(["Manager", "Sales-agent"])        — multiple roles
 */
const authorizeRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}.`
      });
    }
    next();
  };
};

module.exports = authorizeRole;
