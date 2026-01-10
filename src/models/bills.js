const mongoose = require("mongoose");
 const User=require("./user");
const billSchema = new mongoose.Schema({
    // Link to the Shop Owner (User)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Is this a Formal Invoice (Pakka) or Rough Estimate (Kaccha)?
    billType: {
        type: String,
        enum: ["pakka", "kaccha"], 
        required: true
    },

    invoiceNumber: {
        type: String,
        required: true // We will auto-generate this in the controller
    },

    invoiceDate: {
        type: Date,
        default: Date.now
    },

    // Buyer Details
    buyer: {
        clientName: { type: String, required: true },
        clientAddress: { type: String }, // Optional for Kaccha
        clientGst: { type: String }      // Optional for Kaccha
    },

    // Array of Products
    products: [{
        name: { type: String, required: true },
        rate: { type: Number, required: true },
        quantity: { type: Number, required: true },
        amount: { type: Number, required: true } // rate * quantity
    }],

    // Calculations
    gstPercentage: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    
    // Final calculated totals
    subTotal: { type: Number, required: true }, // Before Tax
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true } // Final Amount to Pay

}, { timestamps: true });

module.exports = mongoose.model("Bill", billSchema);