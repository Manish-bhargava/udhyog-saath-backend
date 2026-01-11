const User = require('../../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const signup = async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name) return res.status(400).json({ message: 'Name is required' });
  if (!email || !password) return res.status(400).json({ message: 'Email and Password are required' });

  try {
    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // 4. Generate Token (matching your login logic)
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECREAT_KEY,
      { expiresIn: '24h' }
    );

    // 5. Security: Don't send password back in response
    const userData = user.toObject();
    delete userData.password;

    // 6. Respond with Success & Token
    return res.status(201).json({
      message: 'User created successfully',
      status: 201,
      token: token, // Added token here
      data: userData,
      error: null
    });

  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = signup;