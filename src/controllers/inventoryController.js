const Inventory = require("../models/Inventory");
const Pricing = require("../models/Pricing");

exports.getInventory = async (req, res) => {
  try {
    // FIXED (LOGIC-04 / CROSS-05): Previously returned global inventory shared
    // across all branches. Now scoped to the caller's branch.
    const branch = req.user.branch;
    if (!branch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const [items, priceRows] = await Promise.all([
      Inventory.find({ branch }).sort({ itemName: 1 }).lean(),
      Pricing.find({ branch }).select("productName sellingPrice").lean()
    ]);

    const priceMap = priceRows.reduce((acc, row) => {
      acc[String(row.productName).trim().toLowerCase()] = row.sellingPrice;
      return acc;
    }, {});

    const normalizedItems = items.map((item) => {
      const key = String(item.itemName || "").trim().toLowerCase();
      const authoritativePrice = priceMap[key];
      return {
        ...item,
        salePricePerKg:
          authoritativePrice !== undefined
            ? authoritativePrice
            : Number(item.salePricePerKg || 0)
      };
    });

    const total          = normalizedItems.length;
    const inStockCount   = normalizedItems.filter((i) => i.stockKg > 200).length;
    const lowStockCount  = normalizedItems.filter((i) => i.stockKg > 0 && i.stockKg <= 200).length;
    const outOfStockCount = normalizedItems.filter((i) => i.stockKg === 0).length;

    const totalStockPercentage = total > 0
      ? Math.round((inStockCount / total) * 100)
      : 0;

    return res.json({
      summary: {
        totalStockPercentage,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        total
      },
      items: normalizedItems
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
