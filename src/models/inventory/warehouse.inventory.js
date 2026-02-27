const mongoose = require("mongoose");
const warehouseSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
module.exports = Warehouse;