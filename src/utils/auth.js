const jwt = require("jsonwebtoken");
const userModel = require("../models/user.js");

const verify = async (req, res, next) => {
    try {
        // 1. Check for token in Headers (Frontend sends it here) or Cookies
        const authHeader = req.headers.authorization;
        console.log(authHeader);
        let token;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
        } else {
            token = req.cookies?.token; // Fallback to cookies if needed
        }

        if (!token) {
            return res.status(401).json({ message: "No token provided. User is not verified" });
        }

        // 2. Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECREAT_KEY);
        
        // 3. Find user (Using ID is faster than email if your JWT contains id)
        const user = await userModel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.status(401).json({ message: "User not found. User is not verified" });
        }

        // 4. Attach user to request object
        req.user = user;
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({ message: "Invalid token. User is not verified" });
    }
};

module.exports = verify;