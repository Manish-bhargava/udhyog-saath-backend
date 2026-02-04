const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const User = require("../../../models/user"); // Adjust path to your User model
const verify = require("../../../utils/auth"); // Your auth middleware

const paymentRouter = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// --- API 1: Create Order (When user clicks "Buy Premium") ---
 paymentRouter.post("/create-order", verify, async (req, res) => {
    try {
        const amount = 499; // Amount in INR (e.g., 499 Rupees)
        
        const options = {
            amount: amount * 100, // Razorpay takes amount in paisa (49900)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);

        res.json({
            success: true,
            orderId: order.id,
            amount: amount,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Payment Order Error:", error);
        res.status(500).json({ success: false, message: "Could not create order" });
    }
});

// --- API 2: Verify Payment & Upgrade User (After Payment Success) ---
 paymentRouter.post("/verify-payment", verify, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 1. Verify Signature (Security Check)
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        // 2. PAYMENT SUCCESSFUL: Find User and Upgrade
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 3. Update Plan Logic
        user.plan = "premium";
        
        // Set Expiry to 30 days from now
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        user.planExpiry = new Date(Date.now() + thirtyDays);
        
        // IMMEDIATE BENEFIT: Increase limit immediately
        user.aiCredits.limit = 100; // Premium limit
        // Optional: Reset used credits so they get a fresh start
        user.aiCredits.used = 0; 

        await user.save();

        res.json({ 
            success: true, 
            message: "Payment successful! You are now a Premium member.",
            newPlan: "premium"
        });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error verifying payment" });
    }
});

module.exports =  paymentRouter;