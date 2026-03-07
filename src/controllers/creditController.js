const mongoose = require("mongoose");
const Sale = require("../models/sales");

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// Escape special regex characters so user input is treated as plain text.
function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build branch/user scope so users only see allowed credit records.
async function buildScopeFilter(user) {
  if (user.role === "Sales-agent") {
    return { recordedBy: new mongoose.Types.ObjectId(user.id) };
  }

  if (user.role === "Manager") {
    if (!user.branch) {
      return { _id: new mongoose.Types.ObjectId("000000000000000000000000") };
    }
    return { branch: user.branch };
  }

  return {};
}

// GET /credits
exports.getCreditSales = async (req, res) => {
  try {
    if (req.user.role === "Manager" && !req.user.branch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const scopeFilter = await buildScopeFilter(req.user);

    const credits = await Sale.find({
      saleType: "credit",
      status: { $in: ["pending", "partial"] },
      ...scopeFilter
    })
      .populate("recordedBy", "name")
      .sort({ dueDate: 1 })
      .lean();

    return res.status(200).json({ count: credits.length, data: credits });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /credits/all
exports.getAllCreditSales = async (req, res) => {
  try {
    if (req.user.role === "Manager" && !req.user.branch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const { branch, category, startDate, endDate } = req.query;
    const scopeFilter = await buildScopeFilter(req.user);
    const filters = { saleType: "credit", ...scopeFilter };

    if (req.user.role === "Director" && branch && branch !== "all") {
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

    const credits = await Sale.find(filters)
      .populate("recordedBy", "name")
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({ count: credits.length, data: credits });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /credits/search?query=...
exports.searchCreditSales = async (req, res) => {
  try {
    if (req.user.role === "Manager" && !req.user.branch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const rawQuery = (req.query.query || "").trim();

    // Basic validation to prevent empty searches.
    if (!rawQuery) {
      return res.status(400).json({ message: "Please enter a search value." });
    }

    // Keep query size small and safe.
    if (rawQuery.length > 100) {
      return res.status(400).json({ message: "Search value is too long." });
    }

    const safeRegex = new RegExp(escapeRegex(rawQuery), "i");
    const scopeFilter = await buildScopeFilter(req.user);

    // Search important credit fields with one input.
    const credits = await Sale.find({
      saleType: "credit",
      status: { $in: ["pending", "partial"] },
      ...scopeFilter,
      $or: [
        { buyerName: { $regex: safeRegex } },
        { NationalID: { $regex: safeRegex } },
        { contact: { $regex: safeRegex } },
        { location: { $regex: safeRegex } },
        { produceName: { $regex: safeRegex } },
        { produceType: { $regex: safeRegex } },
        { branch: { $regex: safeRegex } }
      ]
    })
      .populate("recordedBy", "name")
      .sort({ date: -1 })
      .lean();

    if (!credits.length) {
      return res.status(404).json({
        message: "No credit records found for your search.",
        count: 0,
        data: []
      });
    }

    return res.status(200).json({
      message: "Credit records found.",
      count: credits.length,
      data: credits
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /credits/:id
exports.getCreditSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    const sale = await Sale.findOne({ _id: id, saleType: "credit" })
      .populate("recordedBy", "name")
      .lean();

    if (!sale) {
      return res.status(404).json({ message: "Credit sale not found" });
    }

    return res.status(200).json({ data: sale });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /credits/:id/pay
exports.makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount } = req.body;
    const userBranch = String(req.user.branch || "").trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    if (!userBranch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const amount = Number(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ message: "Credit sale not found" });
    }

    if (sale.saleType !== "credit") {
      return res.status(400).json({ message: "This record is not a credit sale" });
    }

    if (String(sale.branch || "").trim() !== userBranch) {
      return res.status(403).json({
        message: "This credit belongs to another branch and cannot be updated."
      });
    }

    if (sale.status === "paid" || (sale.amountDue || 0) <= 0) {
      return res.status(400).json({ message: "This credit sale is already fully paid" });
    }

    if (roundedAmount > sale.amountDue) {
      return res.status(400).json({
        message: `Payment of ${roundedAmount} exceeds remaining balance of ${sale.amountDue}. Overpayment is not allowed.`,
        amountDue: sale.amountDue
      });
    }

    sale.amountDue = Math.round((sale.amountDue - roundedAmount) * 100) / 100;
    sale.status = sale.amountDue <= 0 ? "paid" : "partial";
    sale.paymentHistory = Array.isArray(sale.paymentHistory) ? sale.paymentHistory : [];
    sale.paymentHistory.push({
      amount: roundedAmount,
      date: todayStr(),
      recordedBy: new mongoose.Types.ObjectId(req.user.id)
    });

    await sale.save();

    const message =
      sale.status === "paid"
        ? "Payment successful. Credit sale has been fully settled."
        : `Payment of ${roundedAmount} received. Remaining balance: ${sale.amountDue}`;

    return res.status(200).json({
      message,
      status: sale.status,
      amountDue: sale.amountDue,
      data: sale
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
