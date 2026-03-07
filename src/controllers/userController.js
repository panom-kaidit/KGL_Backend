const User = require("../models/User");

exports.getVisibleUsers = async (req, res) => {
  try {
    let users = [];
    let branch = null;

    if (req.user.role === "Director") {
      users = await User.find({})
        .select("-password")
        .sort({ name: 1 })
        .lean();
    } else if (req.user.role === "Manager") {
      branch = req.user.branch;

      if (!branch) {
        return res.status(400).json({
          message: "Your account has no branch assigned. Please contact a Director."
        });
      }

      users = await User.find({ branch })
        .select("-password")
        .sort({ name: 1 })
        .lean();
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({
      branch,
      count: users.length,
      data: users
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * GET /users/branch
 *
 * Returns all users that belong to the logged-in manager's branch.
 *
 * Security model:
 *  - Branch is read exclusively from req.user.branch (set by the JWT),
 *    never from query-string or request body — so a manager cannot craft
 *    a request to see another branch's users.
 *  - Passwords are stripped with .select("-password").
 *  - Route is protected by authMiddleware + authRole("Manager").
 */
exports.getBranchUsers = async (req, res) => {
  try {
    const branch = req.user.branch;

    if (!branch) {
      return res.status(400).json({
        message: "Your account has no branch assigned. Please contact a Director."
      });
    }

    const users = await User.find({ branch })
      .select("-password")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      branch,
      count: users.length,
      data:  users
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
