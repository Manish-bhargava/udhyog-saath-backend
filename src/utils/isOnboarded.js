const User = require("../models/user"); 
const redis = require("../config/redisClient"); 

const isOnboarded = async (req, res, next) => {
  try {

    const userId = req.user?._id || req.user?.id; 
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user found" });
    }

   
   
    const cacheKey = `user:onboarding:${userId}`;


    const cachedStatus = await redis.get(cacheKey);
   

      
    if (cachedStatus !== null) {
       console.log("cache hit");
      const isComplete = cachedStatus === "true";

      if (!isComplete) {
        return res.status(403).json({
          success: false,
          message: "⛔ Access Denied: onboarding required (Cache)",
          error_code: "WORKSPACE_LOCKED"
        });
      }
      
      return next();
    }
       console.log("cache miss");
             
    const user = await User.findById(userId);
      
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found in Database" });
    }


    const statusString = user.onboarding ? "true" : "false";
    await redis.set(cacheKey, statusString, "EX", 3600);

            
    if (!user.onboarding) {
      return res.status(403).json({
        success: false,
        message: "⛔ Access Denied: onboarding required",
        error_code: "WORKSPACE_LOCKED"
      });
    }

    next();

  } catch (error) {
    console.error("Redis/Middleware Error:", error);

    try {
        const userId = req.user?._id || req.user?.id;
        const user = await User.findById(userId).select("onboarding");
     
        if (user?.onboarding) return next();
    } catch (dbErr) {
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
    
    res.status(500).json({ success: false, message: "Server Error in Auth Check" });
  }
};

module.exports = isOnboarded;