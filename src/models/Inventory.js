const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    category: { type: String, trim: true },

    // FIXED: Added branch — inventory must be branch-specific in a multi-branch system.
    // Previously all managers saw one shared global inventory (data integrity failure).
    branch: {
      type: String,
      required: true,
      enum: ["Maganjo", "Matugga"]
    },

    // FIXED: Added min: 0 — stock must never be stored as negative
    stockKg:        { type: Number, required: true, default: 0, min: 0 },
    costPerKg:      { type: Number, default: 0,  min: 0 },
    salePricePerKg: { type: Number, default: 0,  min: 0 }
  },
  { timestamps: true }
);

// ADDED: One inventory record per item per branch (enforced at DB level)
inventorySchema.index({ itemName: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model("Inventory", inventorySchema);
