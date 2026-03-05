const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getInventory } = require("../controllers/inventoryController");

const router = express.Router();

// GET /api/inventory
router.get("/", authMiddleware, getInventory);

module.exports = router;
