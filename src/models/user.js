const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    onboarding: {
        type: Boolean,
        default: false,
    },

    // --- SUBSCRIPTION STATUS ---
    plan: {
        type: String,
        enum: ["free", "premium"], // You can add 'pro' later if needed
        default: "free"
    },
    planExpiry: {
        type: Date, // If null, they are free forever. If date, check if expired.
        default: null
    },
    
    // --- CREDIT SYSTEM ---
    aiCredits: {
        limit: { type: Number, default: 2 }, // Current limit based on plan
        used: { type: Number, default: 0 },
        lastReset: { type: Date, default: Date.now }
    }

}, { timestamps: true });

// --- SMART RESET LOGIC ---
// Call this before every AI request.
// It resets the count if it's a new day AND updates the limit based on their plan.
userSchema.methods.checkAndResetCredits = async function() {
    const now = new Date();
    const lastReset = new Date(this.aiCredits.lastReset);

    // 1. Check if Plan Expired (Downgrade to free if time is up)
    if (this.plan === 'premium' && this.planExpiry && now > this.planExpiry) {
        this.plan = 'free';
        this.planExpiry = null;
    }

    // 2. Define Limits
    const FREE_LIMIT = 10;
    const PREMIUM_LIMIT = 100; // You can change this to 50 or unlimited

    // 3. Check if it is a new day (Reset Logic)
    const isNewDay = now.getDate() !== lastReset.getDate() || 
                     now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
        // Reset usage to 0
        this.aiCredits.used = 0;
        this.aiCredits.lastReset = now;

        // Update limit based on current plan
        if (this.plan === 'premium') {
            this.aiCredits.limit = PREMIUM_LIMIT;
        } else {
            this.aiCredits.limit = FREE_LIMIT;
        }

        await this.save();
    }
};

const User = mongoose.model("User", userSchema);
module.exports = User;