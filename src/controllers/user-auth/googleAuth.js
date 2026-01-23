const User = require("../../models/user"); // Path to your User Model
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto"); // Built-in Node module for random strings
require("dotenv").config();

// Initialize Google Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // 1. Verify the Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // 2. Check if user exists in your DB
    let user = await User.findOne({ email });

    let isNewUser = false;

    if (!user) {
      // --- CRITICAL STEP FOR YOUR SCHEMA ---
      // Your schema requires a password. We generate a random, secure one.
      // The user won't know this password, which is fine (they use Google).
      // If they want to use password login later, they can use "Forgot Password".
      const randomPassword = crypto.randomBytes(32).toString("hex");

      // 3. Create New User
      user = new User({
        name: name,
        email: email,
        password: randomPassword, // Satisfies "required: true"
        onboarding: true,         // Mark as needing onboarding
        // plan & aiCredits will use your Schema defaults ("free", limit: 2)
      });
      
      await user.save();
      isNewUser = true;
    }

    // 4. Generate Token
    // Matches your verify middleware: jwt.verify(token, process.env.JWT_SECREAT_KEY)
    const jwtToken = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECREAT_KEY, // Keeping your spelling variable
      { expiresIn: "24h" }
    );

    // 5. Set Cookie (Optional, matching your previous logic)
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 6. Send Response
    return res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        onboarding: user.onboarding, // Frontend can check this to show welcome screens
        aiCredits: user.aiCredits
      },
      isNewUser: isNewUser // Helpful flag for frontend redirection
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = googleLogin;