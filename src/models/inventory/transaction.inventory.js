const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  type: {
    type: String,
    enum: ["PURCHASE", "SALE", "CONVERSION", "ADJUSTMENT", "TRANSFER"],
    required: true,
  },
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      direction: {
        type: String,
        enum: ["IN", "OUT"],
        required: true
      }
    }
  ],
  referenceNote: String
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;