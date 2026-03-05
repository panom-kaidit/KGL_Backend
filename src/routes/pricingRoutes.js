const express       = require("express");
const router        = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRole  = require("../middlewares/rbaMiddleware");
const { getBranchPricing, updateBranchPrice } = require("../controllers/pricingController");

// All pricing routes require a valid JWT
router.use(authMiddleware);

// FIXED: Previously router.use(authorizeRole("Manager")) blocked ALL pricing
// routes for Sales-agents, including the read endpoint they need to see current
// prices before selling.
//
// GET  /api/pricing            → Manager OR Sales-agent (same branch, read-only)
// PUT  /api/pricing/:name      → Manager only (price update)
router.get("/",            authorizeRole(["Manager", "Sales-agent"]), getBranchPricing);
router.put("/:productName", authorizeRole("Manager"),                  updateBranchPrice);

module.exports = router;
