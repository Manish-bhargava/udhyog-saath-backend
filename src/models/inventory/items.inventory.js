const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    imageUrl: String,

    brand: String,
    location: String,
    weight: String,

    type: {
      type: String,
      enum: ["RAW", "FINISHED"],
      required: true,
    },

    canBeSold: Boolean,
    canBePurchased: Boolean,
    canBeManufactured: Boolean,

    unit: {
      type: String,
      required: true,
    },

    costPrice: {
      type: Number, 
    },

    sellingPrice: {
      type: Number,
    },

    reorderLevel: {
      type: Number, // alert threshold
      default: 0,
    },

    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Same name allowed in different warehouses (per type).
itemSchema.index({ businessId: 1, name: 1, type: 1, warehouseId: 1 }, { unique: true });

const Item = mongoose.model("Item", itemSchema);
module.exports = Item;