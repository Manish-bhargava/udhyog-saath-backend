const mongoose = require("mongoose");

const conversionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  outputItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },
  inputs: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
    }
  ]
}, { timestamps: true });
const Conversion = mongoose.model("Conversion", conversionSchema);

module.exports = Conversion;