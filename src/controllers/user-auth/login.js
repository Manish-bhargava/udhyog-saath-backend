const User = require('../../models/user'); 
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function login(req, res) {
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

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECREAT_KEY);

  res.cookie("token", token, {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    maxAge: 24 * 60 * 60 * 1000
  });

  res.status(200).json({
    message: "User logged in successfully",
    status:200,
    data: user,
    error:null
  });
}

module.exports = login;