const express       = require("express");
const bcrypt        = require("bcryptjs");
const jwt           = require("jsonwebtoken");
const User          = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRole  = require("../middlewares/rbaMiddleware");
const { getBranchUsers } = require("../controllers/userController");

const router = express.Router();

// ── POST /users/register ─────────────────────────────────────────────────────
// FIXED (USER-MGMT LOGIC):
//   - Director can ONLY create Managers.
//   - Manager can ONLY create Sales-agents.
//   - Manager branch is always forced to manager's own branch.
//   - Manager cannot create users for other branches.
//   - Others: 403
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const caller = req.user;

    if (!["Director", "Manager"].includes(caller.role)) {
      return res.status(403).json({ message: "Access denied: only Directors and Managers can register users" });
    }

    const { name, email, password, role, phone, bio } = req.body;
    let   { branch } = req.body;

    // Managers can only create Sales-agents for their own branch.
    if (caller.role === "Manager") {
      if (role && role !== "Sales-agent") {
        return res.status(403).json({ message: "Managers can only register Sales-agents" });
      }
      // Force branch to manager's own branch — cannot assign another branch.
      branch = caller.branch;
    }

    // Directors can only create Managers.
    if (caller.role === "Director") {
      if (role !== "Manager") {
        return res.status(403).json({ message: "Directors can only register Managers" });
      }
      // Director must assign a branch to the new Manager.
      if (!branch) {
        return res.status(400).json({ message: "Branch is required when registering a Manager" });
      }
    }

    // Basic input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "Sales-agent",
      branch,
      phone: phone || "",
      bio: bio || ""
    });

    await newUser.save();
    return res.status(201).json({ message: "User created successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ── POST /users/login ────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Use the same message for both "not found" and "wrong password" to
      // prevent user enumeration attacks
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, branch: user.branch || "" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({ message: "Login successful", token });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ── GET /users/branch ────────────────────────────────────────────────────────
// Manager sees only their own branch's users (branch from JWT, never from query).
// Must be before /:id to prevent "branch" being captured as an id.
router.get("/branch", authMiddleware, authorizeRole("Manager"), getBranchUsers);

// ── PUT /users/:id ───────────────────────────────────────────────────────────
// FIXED (SECURITY-03): Was only authMiddleware with no ownership check.
// Any authenticated user could update any other user's profile (IDOR).
// Now: a user may only update their own profile; Directors may update anyone.
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const caller   = req.user;

    // Ownership check — only self or Director
    if (targetId !== String(caller.id) && caller.role !== "Director") {
      return res.status(403).json({ message: "Access denied: you may only update your own profile" });
    }

    const { bio, profilePicture } = req.body;

    const updateFields = {};
    if (bio !== undefined)            updateFields.bio            = bio;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(
      targetId,
      { $set: updateFields },
      // Use returnDocument:'after' to return the updated document (replaces new:true).
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ── GET /users/:id ───────────────────────────────────────────────────────────
// FIXED (SECURITY-04): Was only authMiddleware — any authenticated user could
// read any other user's full profile by guessing ObjectIds (IDOR).
// Now: a user may only read their own profile, or a Manager reads branch users
// (handled by /branch), or a Director reads anyone.
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id;
    const caller   = req.user;

    // Allow: own profile, or Director, or Manager reading same-branch user
    const isSelf     = String(targetId) === String(caller.id);
    const isDirector = caller.role === "Director";

    if (!isSelf && !isDirector) {
      // Manager may read users in their own branch — verify the target is in branch
      if (caller.role === "Manager") {
        const target = await User.findById(targetId).select("branch").lean();
        if (!target) {
          return res.status(404).json({ message: "User not found" });
        }
        if (target.branch !== caller.branch) {
          return res.status(403).json({ message: "Access denied: user is not in your branch" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const user = await User.findById(targetId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
