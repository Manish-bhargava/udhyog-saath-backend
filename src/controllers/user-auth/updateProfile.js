const User = require("../../models/user"); // Adjust path as needed

const updateProfile = async (req, res) => {
    try {
        // 1. Get user ID from the 'verify' middleware
        const userId = req.user._id;

        // 2. Extract allowed fields from body
        // We don't want to update 'password' or 'email' here usually
        // because those require separate logic (hashing/verification).
        const { name, onboarding } = req.body;

        // 3. Find and update the user
        // { new: true } returns the updated document instead of the old one
        // { runValidators: true } ensures the update follows your schema rules
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, onboarding },
            { new: true, runValidators: true }
        ).select("-password"); // Hide password in the response

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = updateProfile;