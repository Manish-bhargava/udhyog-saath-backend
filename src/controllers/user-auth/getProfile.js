const User = require("../../models/user");
const Onboarding = require("../../models/onboarding"); // Make sure to import the Onboarding model

const getUserProfile= async (req, res) => {
  try {
    // 1. Fetch the User (Basic Info)
    const user = await User.findById(req.user._id).select("name email onboarding createdAt");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // 2. Prepare the base response object
    let responseData = {
      id: user._id,
      name: user.name,
      email: user.email,
      isOnboarded: user.onboarding || false,
      joinedAt: user.createdAt
    };

    // 3. If user is onboarded, fetch Company Details from Onboarding collection
    if (user.onboarding) {
      const onboardingData = await Onboarding.findOne({ user: user._id });

      if (onboardingData) {
        // Merge company details into the response
        responseData.company = onboardingData.company;
        responseData.bankDetails = onboardingData.BankDetails;
      }
    }

    // 4. Send the final response
    return res.status(200).json({
      success: true,
      data: responseData
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