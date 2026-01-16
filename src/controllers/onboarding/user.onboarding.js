const Onboarding = require("../../models/onboarding"); // Check this path
const User = require("../../models/user"); // Import User model to update the flag

exports.userOnboarding = async (req, res) => {
    try {

        const userId = req.user ? req.user._id : req.body.userId;
          
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: "User ID missing. Are you logged in?" 
            });
        }

        const { 
            companyName, companyEmail, companyAddress, companyPhone,
            companyLogo, companyDescription, GST, companyStamp, companySignature,
            accountNumber, IFSC, bankName, branchName
        } = req.body;

        // 2. Check for duplicates
        // const existingProfile = await Onboarding.findOne({ user: userId });
        // console.log(existingProfile);
        // if (existingProfile) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Onboarding already completed."
        //     });
        // }

        // 3. Create the Instance
        const newOnboarding = new Onboarding({
            user: userId, // CORRECTION: Assign ID here, not to the Class
            
            company: {
                companyName, companyEmail, companyAddress, companyPhone,
                companyLogo, companyDescription, GST, companyStamp, companySignature
            },

            BankDetails: {
                accountNumber, IFSC, bankName, branchName
            }
        });

        // 4. Save Onboarding Data
        await newOnboarding.save();

        // 5. Update the User's "Onboarding" flag safely
     const updatedUser =  await User.findByIdAndUpdate(userId, 
        { onboarding: true },{ new: true });
       console.log(updatedUser);
        
        res.status(201).json({
            success: true,
            message: "Onboarding Completed Successfully",
            data: newOnboarding
        });
        
    } catch (error) {
        console.error("Onboarding Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error", 
            error: error.message 
        });
    }
};