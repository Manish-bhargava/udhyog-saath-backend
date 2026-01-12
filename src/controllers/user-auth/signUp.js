const User = require('../../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name) return res.status(400).json({ message: 'Name is required' });
  if (!email || !password) return res.status(400).json({ message: 'Email and Password are required' });

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

  
    const token = jwt.sign(
      { email: user.email, id: user._id }, 
      process.env.JWT_SECREAT_KEY,
      { expiresIn: '24h' }
    );

    // Set cookie (since your auth.js checks cookies first)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000
    });

    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      message: 'User created successfully',
      status: 201,
      token: token, 
      data: userData,
      error: null
    });

  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = signup;