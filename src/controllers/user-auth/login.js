const User = require('../../models/user'); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 1. Generate Token
    const token = jwt.sign(
      { email: user.email, id: user._id }, 
      process.env.JWT_SECREAT_KEY,
      { expiresIn: '24h' } // Good practice to add expiration
    );

    // 2. Set Cookie (Optional: keep if you want both, but Headers are better for SPAs)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000
    });

    // 3. IMPORTANT: Send token in the JSON response
    return res.status(200).json({
      message: "User logged in successfully",
      status: 200,
      token: token, // <--- Add this line
      data: user,
      error: null
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = login;