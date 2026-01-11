const { chatWithAgent } = require('../../utils/aiAgent');

const handleUserMessage = async (req, res) => {
    try {
        const { message } = req.body;

        // Ensure we have a user from the 'protect' middleware
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        // Call the agent (contextData is now handled internally by tools)
        const reply = await chatWithAgent(req.user._id, message);

        return res.status(200).json({ 
            success: true, 
            reply 
        });

    } catch (error) {
        console.error("Controller Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "The AI agent is currently offline." 
        });
    }
};

module.exports = { handleUserMessage };