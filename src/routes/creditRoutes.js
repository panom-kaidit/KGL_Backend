const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  getCreditSales,
  getAllCreditSales,
  searchCreditSales,
  getCreditSaleById,
  makePayment
} = require("../controllers/creditController");

// List active credit sales
router.get("/", authMiddleware, getCreditSales);

// List ALL credit sales (including paid)
router.get("/all", authMiddleware, getAllCreditSales);

// Flexible search by customer details / NIN / phone / location / product
router.get("/search", authMiddleware, searchCreditSales);

// Single credit sale detail
router.get("/:id", authMiddleware, getCreditSaleById);

// Process a payment
router.patch("/:id/pay", authMiddleware, makePayment);

module.exports = router;
