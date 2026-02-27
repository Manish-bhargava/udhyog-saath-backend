const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
    index: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

inventorySchema.index(
  { businessId: 1, warehouseId: 1, itemId: 1 },
  { unique: true }
);

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;