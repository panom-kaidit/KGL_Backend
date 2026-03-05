const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema({
  produceName:   { type: String, required: true },
  produceType:   { type: String, required: true },
  date:          { type: String, required: true },
  time:          { type: String, required: true },
  tonnage:       { type: Number, required: true, min: 0.1 },
  cost:          { type: Number, required: true, min: 0 },
  dealerName:    { type: String, required: true },

  // FIXED: branch is now required — was optional, allowing records without branch
  branch: {
    type: String,
    required: true,
    enum: ["Maganjo", "Matugga"]
  },

  contact:       { type: String, required: true },
  sellingPrice:  { type: Number, required: true },

  // ADDED: invoiceNumber — was validated and accepted from client but silently
  // dropped because it wasn't in the schema. Data was being lost.
  invoiceNumber: { type: String, default: "" },

  // ADDED: paymentMethod and paymentStatus — same problem, accepted but lost
  paymentMethod: { type: String, default: "" },
  paymentStatus: { type: String, default: "" },

  recordedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recordedByName: { type: String, required: true }
});

module.exports = mongoose.model("Procurement", procurementSchema);
