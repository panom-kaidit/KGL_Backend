const Pricing     = require("../models/Pricing");
const Procurement = require("../models/procurement");
const { setSellingPrice } = require("../services/inventoryService");

// ─── GET /api/pricing ────────────────────────────────────────────────────────
// Returns all products procured by this branch, merged with their current
// branch-specific selling price.  Branch is always read from the JWT — never
// from the request body or query string.
exports.getBranchPricing = async (req, res) => {
  try {
    const { branch } = req.user;

    if (!branch) {
      return res.status(400).json({
        message: "Your account has no branch assigned. Contact a Director.",
      });
    }

    // 1. Aggregate procurement records for this branch:
    //    group by produceName → latest buying price + category
    const procurementData = await Procurement.aggregate([
      { $match: { branch } },
      { $sort: { _id: -1 } },
      {
        $group: {
          _id:         "$produceName",
          produceType: { $first: "$produceType" },
          buyingPrice: { $first: "$cost" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (procurementData.length === 0) {
      return res.status(200).json({ branch, products: [] });
    }

    // 2. Fetch all existing pricing records for this branch in one query
    const productNames  = procurementData.map((p) => p._id);
    const pricingRecords = await Pricing.find({
      branch,
      productName: { $in: productNames },
    })
      .populate("updatedBy", "name")
      .lean();

    // 3. Build a fast lookup map  { productName → pricingRecord }
    const pricingMap = pricingRecords.reduce((acc, p) => {
      acc[p.productName] = p;
      return acc;
    }, {});

    // 4. Merge into a single response array
    const products = procurementData.map((p) => {
      const pricing = pricingMap[p._id] || null;
      return {
        productName:  p._id,
        produceType:  p.produceType,
        buyingPrice:  p.buyingPrice,
        sellingPrice: pricing ? pricing.sellingPrice : null,
        lastUpdated:  pricing ? pricing.updatedAt    : null,
        updatedBy:    pricing && pricing.updatedBy ? pricing.updatedBy.name : null,
        hasPricing:   !!pricing,
      };
    });

    return res.status(200).json({ branch, products });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PUT /api/pricing/:productName ───────────────────────────────────────────
// Upserts the selling price for one product in the manager's branch.
// Business rules enforced:
//   • sellingPrice must be a positive number
//   • sellingPrice cannot be lower than the latest buying price for that branch
//   • branch is taken from JWT — a manager can only touch their own branch
exports.updateBranchPrice = async (req, res) => {
  try {
    const { branch, id: userId } = req.user;
    const productName = decodeURIComponent(req.params.productName);
    const { sellingPrice } = req.body;

    if (!branch) {
      return res.status(400).json({
        message: "Your account has no branch assigned. Contact a Director.",
      });
    }

    // ── Validate input ───────────────────────────────────────────────────────
    if (sellingPrice === undefined || sellingPrice === null) {
      return res.status(400).json({ message: "sellingPrice is required." });
    }

    const price = Number(sellingPrice);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        message: "Selling price must be a positive number.",
      });
    }

    // ── Verify the product exists in this branch (and get buying price) ──────
    const latestProcurement = await Procurement.findOne(
      { produceName: productName, branch },
      { cost: 1, produceType: 1 }
    ).sort({ _id: -1 });

    if (!latestProcurement) {
      return res.status(404).json({
        message: `Product "${productName}" was not found in branch ${branch}.`,
      });
    }

    const buyingPrice = latestProcurement.cost;

    // ── Enforce: selling price cannot be below buying price ──────────────────
    if (price < buyingPrice) {
      return res.status(400).json({
        message: `Selling price (${price.toLocaleString()} UGX) cannot be lower than the buying price (${buyingPrice.toLocaleString()} UGX).`,
      });
    }

    // ── Upsert: one record per (productName, branch) ──────────────────────────
    const updated = await Pricing.findOneAndUpdate(
      { productName, branch },
      {
        $set: {
          productName,
          produceType: latestProcurement.produceType,
          branch,
          sellingPrice: price,
          updatedBy:    userId,
        },
      },
      // Use returnDocument:'after' to return the updated document (replaces new:true).
      { returnDocument: "after", upsert: true, runValidators: true }
    ).populate("updatedBy", "name");

    // Keep inventory sell price in sync for dashboard and stock views.
    await setSellingPrice({
      itemName: productName,
      branch,
      sellingPrice: price
    });

    return res.status(200).json({
      message: "Price updated successfully.",
      product: {
        productName:  updated.productName,
        branch:       updated.branch,
        sellingPrice: updated.sellingPrice,
        updatedBy:    updated.updatedBy ? updated.updatedBy.name : null,
        updatedAt:    updated.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
