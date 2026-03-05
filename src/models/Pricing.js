const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    produceType:  { type: String, trim: true, default: "" },
    branch: {
      type: String,
      required: true,
      enum: ["Maganjo", "Matugga"],
    },
    sellingPrice: { type: Number, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One price record per product per branch — enforced at DB level
pricingSchema.index({ productName: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model("Pricing", pricingSchema);
