const mongoose = require("mongoose");

const paymentEntrySchema = new mongoose.Schema(
  {
    amount:     { type: Number, required: true },
    date:       { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema({
  saleType: { type: String, enum: ["cash", "credit"], required: true },

  produceName: { type: String, required: true },
  produceType:  String,
  tonnage:      { type: Number, required: true, min: 0.1 },

  // ADDED: branch — required for branch-scoped statistics, manager view, and
  // inventory deduction. Previously absent, forcing indirect lookup via agent IDs.
  branch: {
    type: String,
    enum: ["Maganjo", "Matugga"],
    required: true
  },

  // ADDED: pricePerKg — records the authoritative per-unit price at time of sale
  // (set server-side from the Pricing model, never trusted from client).
  pricePerKg: { type: Number, default: 0, min: 0 },

  // payment fields — values are set server-side, never trusted from client
  amountPaid: { type: Number, min: 0 },
  amountDue:  { type: Number, min: 0 },
  date:       String,
  time:       String,

  // shared info
  buyerName:  String,
  NationalID: String,
  location:   String,
  contact:    String,
  salesAgent: String,

  dueDate:      String,
  dispatchDate: String,

  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Credit payment tracking
  status: {
    type:    String,
    enum:    ["pending", "partial", "paid"],
    default: "pending"
  },

  // Immutable log of every payment received against this credit sale
  paymentHistory: { type: [paymentEntrySchema], default: [] }
});

module.exports = mongoose.model("Sale", saleSchema);
