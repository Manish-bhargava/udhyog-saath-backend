const User = require("../../models/user"); // Import User model
const { chatWithAgent } = require('../../utils/aiAgent');

const handleUserMessage = async (req, res) => {
    try {
        const { message } = req.body;

        // 1. Validate User ID from Middleware
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        // 2. Fetch the User (We need the latest 'aiCredits' data from DB)
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 3. RUN THE CHECK: Reset credits if it's a new day
        // This modifies 'user' in memory but doesn't save yet unless a reset happened
        await user.checkAndResetCredits(); 

        // 4. CHECK LIMITS: Block if they are out of credits
        if (user.aiCredits.used >= user.aiCredits.limit) {
            return res.status(403).json({ 
                success: false, 
                errorType: "LIMIT_REACHED", // Frontend can use this to show "Upgrade" popup
                message: `You have used your daily limit of ${user.aiCredits.limit} messages. Upgrade to Premium for more!` 
            });
        }

   
        const reply = await chatWithAgent(user._id, message);

     
        user.aiCredits.used += 1;
        await user.save();

        return res.status(200).json({ 
            success: true, 
            reply,
            creditsLeft: user.aiCredits.limit - user.aiCredits.used // Optional: Show user remaining credits
        });

    } catch (error) {
        console.error("Controller Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "The AI agent is currently offline. Please try again later." 
        });
    }
};

module.exports = { handleUserMessage };