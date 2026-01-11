const User = require("../../models/user");
const bcrypt = require("bcrypt");

const changePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { oldPassword, newPassword } = req.body;

        // 1. Basic validation
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Both old and new passwords are required" });
        }

        // 2. Fetch user (including password field which is usually hidden)
        const user = await User.findById(userId).select("+password");

        // 3. Verify OLD password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        // 4. Hash NEW password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 5. Update and Save
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        console.error("Change Password Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = changePassword;