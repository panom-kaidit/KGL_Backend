const Inventory = require("../models/Inventory");

function normalizeItemName(name) {
  return String(name || "").trim();
}

async function increaseStock({
  itemName,
  branch,
  quantityKg,
  category,
  costPerKg,
  session
}) {
  const qty = Number(quantityKg);
  if (!itemName || !branch || Number.isNaN(qty) || qty <= 0) {
    throw new Error("Invalid inventory increase payload");
  }

  return Inventory.findOneAndUpdate(
    { itemName: normalizeItemName(itemName), branch },
    {
      $inc: { stockKg: qty },
      $set: {
        category: category || "",
        costPerKg: Number(costPerKg) || 0
      }
    },
    {
      upsert: true,
      // Use returnDocument:'after' to return the updated document (replaces new:true).
      returnDocument: "after",
      runValidators: true,
      session
    }
  );
}

async function decreaseStock({
  itemName,
  branch,
  quantityKg,
  session
}) {
  const qty = Number(quantityKg);
  if (!itemName || !branch || Number.isNaN(qty) || qty <= 0) {
    throw new Error("Invalid inventory decrease payload");
  }

  return Inventory.findOneAndUpdate(
    {
      itemName: normalizeItemName(itemName),
      branch,
      stockKg: { $gte: qty }
    },
    { $inc: { stockKg: -qty } },
    // Use returnDocument:'after' to return the updated document (replaces new:true).
    { returnDocument: "after", session }
  );
}

async function setSellingPrice({
  itemName,
  branch,
  sellingPrice,
  session
}) {
  const price = Number(sellingPrice);
  if (!itemName || !branch || Number.isNaN(price) || price < 0) {
    throw new Error("Invalid inventory price payload");
  }

  return Inventory.findOneAndUpdate(
    { itemName: normalizeItemName(itemName), branch },
    { $set: { salePricePerKg: price } },
    // Use returnDocument:'after' to return the updated document (replaces new:true).
    { returnDocument: "after", runValidators: true, session }
  );
}

module.exports = {
  increaseStock,
  decreaseStock,
  setSellingPrice
};
