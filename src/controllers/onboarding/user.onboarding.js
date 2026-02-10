const Onboarding = require("../../models/onboarding");
const User = require("../../models/user");
const { uploadImage } = require("../../services/cloudinary");


exports.userOnboarding = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : req.body.userId;
    const {
      companyName,
      companyEmail,
      companyAddress,
      companyPhone,
      companyDescription,
      GST,
      accountNumber,
      IFSC,
      bankName,
      branchName,
    } = req.body;

    const companyLogo = await uploadImage(req.files?.companyLogo?.[0]?.path) || req.body?.companyLogo;
    const companySignature = await uploadImage(req.files?.companySignature?.[0]?.path) || req.body?.companySignature;
    const companyStamp = await uploadImage(req.files?.companyStamp?.[0]?.path) || req.body?.companyStamp;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User ID missing. Are you logged in?" });
    }

    const existingProfile = await Onboarding.findOne({ user: userId });


    if (existingProfile) {
      const updatedOnboarding = await Onboarding.findOneAndUpdate(
        { user: userId },
        {
          company: {
            companyName,
            companyEmail,
            companyAddress,
            companyPhone,
            companyLogo,
            companyDescription,
            GST,
            companyStamp,
            companySignature,
          },
          BankDetails: {
            accountNumber,
            IFSC,
            bankName,
            branchName,
          },
        },
        { new: true },
      );

      await User.findByIdAndUpdate(userId, { onboarding: true });

  

      return res.status(200).json({
        success: true,
        msg: "User updated successfully",
        data: updatedOnboarding,
      });
    }
     
    const newOnboarding = new Onboarding({
      user: userId,
      company: {
        companyName,
        companyEmail,
        companyAddress,
        companyPhone,
        companyLogo,
        companyDescription,
        GST,
        companyStamp,
        companySignature,
      },
      BankDetails: {
        accountNumber,
        IFSC,
        bankName,
        branchName,
      },
    });
   
    await newOnboarding.save();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { onboarding: true },
      { new: true },
    );

   


    res.status(201).json({
      success: true,
      message: "Onboarding Completed Successfully",
      data: newOnboarding,
    });

  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};