const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRole = require("../middlewares/rbaMiddleware");
const Sale = require("../models/sales");
const Pricing = require("../models/Pricing");
const Inventory = require("../models/Inventory");
const { decreaseStock } = require("../services/inventoryService");
const { getAgentDashboardSummary } = require("../controllers/salesController");

const router = express.Router();

router.get("/dashboard", authMiddleware, getAgentDashboardSummary);

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const sales = await Sale.find({ recordedBy: req.user.id })
      .sort({ date: -1, time: -1 })
      .lean();
    return res.json({ data: sales });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

router.get(
  "/branch",
  authMiddleware,
  authorizeRole(["Manager", "Director"]),
  async (req, res) => {
    try {
      const callerRole = req.user.role;
      const callerBranch = req.user.branch;
      const { branch, category, startDate, endDate } = req.query;

      if (callerRole === "Manager" && !callerBranch) {
        return res.status(400).json({ message: "No branch assigned to your account" });
      }

      const filters = {};

      if (callerRole === "Manager") {
        filters.branch = callerBranch;
      } else if (branch && branch !== "all") {
        filters.branch = branch;
      }

      if (category && category !== "all") {
        filters.$or = [{ produceType: category }, { produceName: category }];
      }

      if (startDate || endDate) {
        filters.date = {};
        if (startDate) filters.date.$gte = startDate;
        if (endDate) filters.date.$lte = endDate;
      }

      const sales = await Sale.find(filters)
        .populate("recordedBy", "name")
        .sort({ date: -1, time: -1 })
        .lean();

      return res.json({ data: sales });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  }
);

router.post(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      // Temporary debug logs to trace access issues
      console.log("[SALES DEBUG] req.user:", req.user);
      console.log("[SALES DEBUG] req.user.role:", req.user ? req.user.role : null);

      // Allow only Sales-agent and Manager to create sales
      // Director and all other roles are blocked.
      if (req.user.role !== "Sales-agent" && req.user.role !== "Manager") {
        return res.status(403).json({
          message: `Access denied. Role "${req.user.role}" cannot create sales.`
        });
      }

      const {
        saleType,
        produceName,
        produceType,
        tonnage,
        buyerName,
        salesAgentName,
        date,
        time,
        nationalId,
        location,
        contacts,
        dueDate,
        dispatchDate
      } = req.body;

      const agentBranch = req.user.branch;
      if (!agentBranch) {
        return res.status(400).json({
          message: "Your account has no branch assigned. Contact a Manager."
        });
      }

      if (!["cash", "credit"].includes(saleType)) {
        return res.status(400).json({ message: "Invalid sale type" });
      }

      if (!produceName || !tonnage || Number(tonnage) < 0.1) {
        return res.status(400).json({ message: "Produce name and valid tonnage are required" });
      }

      const pricingRecord = await Pricing.findOne({
        productName: String(produceName).trim(),
        branch: agentBranch
      });

      if (!pricingRecord) {
        return res.status(400).json({
          message: `No selling price has been set for "${produceName}" in branch ${agentBranch}. Ask your Manager to set the price first.`
        });
      }

      const pricePerKg = pricingRecord.sellingPrice;
      const calculatedAmount = Math.round(Number(tonnage) * pricePerKg * 100) / 100;

      if (saleType === "cash") {
        if (!buyerName || buyerName.length < 2) return res.status(400).json({ message: "Buyer name required" });
        if (!salesAgentName || salesAgentName.length < 2) return res.status(400).json({ message: "Sales agent name required" });
        if (!date || !time) return res.status(400).json({ message: "Date and time required" });
      }

      if (saleType === "credit") {
        if (!/^[A-Z0-9]{8,}$/.test(nationalId)) return res.status(400).json({ message: "Invalid NIN format" });
        if (!location || location.length < 2) return res.status(400).json({ message: "Location required" });
        if (!/^\+?\d{10,13}$/.test(contacts)) return res.status(400).json({ message: "Invalid phone number" });
        if (!dueDate || !dispatchDate) return res.status(400).json({ message: "Due date and dispatch date required" });
      }

      const sale = new Sale({
        saleType,
        produceName: String(produceName).trim(),
        produceType,
        tonnage: Number(tonnage),
        branch: agentBranch,
        pricePerKg,
        amountPaid: saleType === "cash" ? calculatedAmount : undefined,
        amountDue: saleType === "credit" ? calculatedAmount : undefined,
        buyerName,
        salesAgent: salesAgentName,
        date: date || new Date().toISOString().split("T")[0],
        time: time || new Date().toLocaleTimeString(),
        NationalID: nationalId,
        location,
        contact: contacts,
        dueDate,
        dispatchDate,
        recordedBy: req.user.id
      });

      const inventoryUpdate = await decreaseStock({
        itemName: produceName,
        branch: agentBranch,
        quantityKg: Number(tonnage)
      });

      if (!inventoryUpdate) {
        const invItem = await Inventory.findOne({
          itemName: String(produceName).trim(),
          branch: agentBranch
        });

        if (!invItem) {
          return res.status(400).json({
            message: `"${produceName}" is not in the inventory for branch ${agentBranch}. Record a procurement first.`
          });
        }

        return res.status(400).json({
          message: `Insufficient stock. Available: ${invItem.stockKg} kg, requested: ${tonnage} kg.`,
          available: invItem.stockKg
        });
      }

      try {
        await sale.save();
      } catch (saveError) {
        // If saving sale fails after stock deduction, add stock back.
        await Inventory.findOneAndUpdate(
          { itemName: String(produceName).trim(), branch: agentBranch },
          { $inc: { stockKg: Number(tonnage) } }
        );
        throw saveError;
      }

      return res.status(201).json({
        message: "Sale recorded successfully",
        pricePerKg,
        totalAmount: calculatedAmount
      });
    } catch (error) {
      console.error("[SALES ERROR]", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
