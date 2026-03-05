const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { getManagerStatistics } = require("../controllers/statisticsController");

const router = express.Router();

// GET /api/manager/statistics
router.get("/statistics", authMiddleware, getManagerStatistics);

module.exports = router;
