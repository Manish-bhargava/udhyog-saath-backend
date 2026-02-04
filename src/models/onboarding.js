const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema({
    // Link to User (Validation removed for testing)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    
    company: {
        companyName: {
            type: String,
        },
        companyEmail: {
            type: String,
        },
        companyAddress: {
            type: String,
        },
        companyPhone: {
            type: String,
        },
        companyLogo: {
            type: String,
        },
        companyDescription: {
            type: String,
        },
        GST: {
            type: String,
        },
        companyStamp: {
            type: String,
        },
        companySignature: {
            type: String,
        }
    },

    BankDetails: {
        accountNumber: {
            type: String,
        },
        IFSC: {
            type: String,
        },
        bankName: {
            type: String,
        },
        branchName: {
            type: String,
        }
    }
}, { timestamps: true });

// Renamed model to "Onboarding"
const Onboarding = mongoose.model("Onboarding", onboardingSchema);

module.exports = Onboarding;