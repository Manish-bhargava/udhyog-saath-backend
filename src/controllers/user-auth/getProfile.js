const User = require("../../models/user");


const getUserProfile = async (req, res) => {
  try {

  
    const user = await User.findById(req.user._id).select("name email onboarding companyDetails createdAt");
    console.log(user);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
     console.log(user?.onboarding);
    // 2. Respond with profile data
    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isOnboarded: user.onboarding|| false, // Tells frontend if they finished setup
        joinedAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Get Profile Error:", error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server Error fetching profile" 
    });
  }
};

module.exports = { getUserProfile };