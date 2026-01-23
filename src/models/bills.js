const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    billType: {
        type: String,
        enum: ["pakka", "kaccha"], 
        required: true
    },
    invoiceNumber: {
        type: String,
        required: true 
    },
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    buyer: {
        clientName: { type: String, required: true },
        // Conditionally required fields
        clientAddress: { 
            type: String,
            required: function() { return this.billType === 'pakka'; }
        }, 
        clientGst: { 
            type: String,
            // Depending on your logic, you might not strictly require GST even for Pakka 
            // (e.g. B2C sales), but if it's B2B, you might want this:
            required: function() { return this.billType === 'pakka'; }
        }      
    },
    products: [{
        name: { type: String, required: true },
        rate: { type: Number, required: true },
        quantity: { type: Number, required: true },
        amount: { type: Number, required: true } 
    }],
    gstPercentage: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    subTotal: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true }
}, { timestamps: true });

// COMPOUND INDEX: Validates that invoiceNumber is unique ONLY per User
billSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model("Bill", billSchema);