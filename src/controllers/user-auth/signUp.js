// Import modules
const User = require('../../models/user'); 

const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

const signup = async (req, res) => {
  const { email, password } = req.body;


  if (!email || !password) {
    return res.status(400).json({ message: 'Email and Password are required' });
  }

  try {
   
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

   
    user = new User({
      email,
      password: hashedPassword
    });

  
    await user.save();

   
 

    // 7️⃣ Respond success
    res.status(201).json({ message: 'User created successfully',
      status:200,
      data:user
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = signup;