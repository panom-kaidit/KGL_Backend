const mongoose = require("mongoose");
const Procurement = require("../models/procurement");
const Inventory = require("../models/Inventory");

exports.createProcurement = async (req, res) => {
  try {
    // 1) Read input from the request body
    const {
      supplier_name,
      supplier_contact,
      purchase_date,
      produce_time,
      invoice_number,
      product_name,
      product_category,
      quantity,
      unit_price,
      selling_price,
      payment_method,
      payment_status
    } = req.body;

    // 2) Branch comes from the logged-in user (JWT), not from frontend
    const branch = req.user.branch;
    if (!branch) {
      return res.status(400).json({
        success: false,
        message: "Your account has no branch assigned."
      });
    }

    // 3) Basic validation rules
    const namePattern = /^[A-Za-z0-9 ]+$/;
    const typePattern = /^[A-Za-z ]{2,}$/;
    const dealerPattern = /^[A-Za-z0-9 ]{2,}$/;
    const phonePattern = /^[0-9+]{10,15}$/;

    if (!supplier_name || !dealerPattern.test(supplier_name)) {
      return res.status(400).json({ success: false, message: "Invalid supplier name" });
    }

    if (!supplier_contact || !phonePattern.test(supplier_contact)) {
      return res.status(400).json({ success: false, message: "Invalid supplier contact" });
    }

    if (!purchase_date) {
      return res.status(400).json({ success: false, message: "Purchase date required" });
    }

    if (!produce_time) {
      return res.status(400).json({ success: false, message: "Produce time required" });
    }

    if (!invoice_number) {
      return res.status(400).json({ success: false, message: "Invoice number required" });
    }

    if (!product_name || !namePattern.test(product_name)) {
      return res.status(400).json({ success: false, message: "Invalid product name" });
    }

    if (!product_category || !typePattern.test(product_category)) {
      return res.status(400).json({ success: false, message: "Invalid product category" });
    }

    if (!quantity || Number.isNaN(Number(quantity)) || Number(quantity) < 100) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 100" });
    }

    if (!unit_price || Number.isNaN(Number(unit_price)) || Number(unit_price) < 10000) {
      return res.status(400).json({ success: false, message: "Unit price must be at least 10000" });
    }

    // 4) Calculate fallback selling total if frontend did not provide it
    let finalTotal = Number(selling_price);
    if (!finalTotal || finalTotal === 0) {
      finalTotal = Number(quantity) * Number(unit_price);
    }

    // 5) Create and save the procurement record
    const newProcurement = new Procurement({
      produceName: product_name,
      produceType: product_category,
      date: purchase_date,
      time: produce_time,
      tonnage: Number(quantity),
      cost: Number(unit_price),
      dealerName: supplier_name,
      contact: supplier_contact,
      sellingPrice: finalTotal,
      branch,
      invoiceNumber: invoice_number || "",
      paymentMethod: payment_method || "",
      paymentStatus: payment_status || "",
      recordedBy: req.user.id,
      recordedByName: req.user.name || ""
    });

    const savedProcurement = await newProcurement.save();

    // 6) Update inventory:
    //    - if item exists in this branch, increase stock
    //    - if item does not exist, create it
    try {
      await Inventory.findOneAndUpdate(
        { itemName: product_name, branch },
        {
          $inc: { stockKg: Number(quantity) },
          $set: {
            category: product_category,
            costPerKg: Number(unit_price)
          }
        },
        // Use returnDocument:'after' to return the updated document (replaces new:true).
        { upsert: true, returnDocument: "after", runValidators: true }
      );
    } catch (inventoryError) {
      // If inventory update fails, remove the procurement record we just created
      // so data stays consistent even without transactions.
      await Procurement.findByIdAndDelete(savedProcurement._id);
      throw inventoryError;
    }

    return res.status(201).json({
      success: true,
      message: "Procurement record created and inventory updated successfully",
      data: savedProcurement
    });
  } catch (error) {
    console.error("Error creating procurement:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating procurement record"
    });
  }
};

exports.getAllProcurement = async (req, res) => {
  try {
    // Manager sees only their branch. Director sees all.
    const filter = {};
    if (req.user.role === "Manager") {
      if (!req.user.branch) {
        return res.status(400).json({ success: false, message: "No branch assigned" });
      }
      filter.branch = req.user.branch;
    }

    const procurements = await Procurement.find(filter)
      .populate("recordedBy", "name email")
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({ success: true, data: procurements });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getProcurementById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid procurement ID" });
    }

    const procurement = await Procurement.findById(id)
      .populate("recordedBy", "name email")
      .lean();

    if (!procurement) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Manager cannot access another branch's record
    if (req.user.role === "Manager" && procurement.branch !== req.user.branch) {
      return res.status(403).json({
        success: false,
        message: "Access denied: record is from another branch"
      });
    }

    return res.status(200).json({ success: true, data: procurement });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateProcurement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid procurement ID" });
    }

    const existing = await Procurement.findById(id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Manager cannot update another branch's record
    if (req.user.role === "Manager" && existing.branch !== req.user.branch) {
      return res.status(403).json({
        success: false,
        message: "Access denied: record is from another branch"
      });
    }

    // Update only allowed fields (simple whitelist)
    const {
      supplier_name,
      supplier_contact,
      purchase_date,
      produce_time,
      invoice_number,
      product_name,
      product_category,
      quantity,
      unit_price,
      selling_price,
      payment_method,
      payment_status
    } = req.body;

    const allowedUpdates = {};
    if (supplier_name) allowedUpdates.dealerName = supplier_name;
    if (supplier_contact) allowedUpdates.contact = supplier_contact;
    if (purchase_date) allowedUpdates.date = purchase_date;
    if (produce_time) allowedUpdates.time = produce_time;
    if (invoice_number) allowedUpdates.invoiceNumber = invoice_number;
    if (product_name) allowedUpdates.produceName = product_name;
    if (product_category) allowedUpdates.produceType = product_category;
    if (quantity) allowedUpdates.tonnage = Number(quantity);
    if (unit_price) allowedUpdates.cost = Number(unit_price);
    if (selling_price) allowedUpdates.sellingPrice = Number(selling_price);
    if (payment_method) allowedUpdates.paymentMethod = payment_method;
    if (payment_status) allowedUpdates.paymentStatus = payment_status;

    const updated = await Procurement.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      // Use returnDocument:'after' to return the updated document (replaces new:true).
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteProcurement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid procurement ID" });
    }

    const existing = await Procurement.findById(id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    // Manager cannot delete another branch's record
    if (req.user.role === "Manager" && existing.branch !== req.user.branch) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await Procurement.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
