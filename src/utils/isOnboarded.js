const isOnboarded = async (req, res, next) => {
  try {

    // req.user is already the full user document, attached by the `verify`
    // middleware which always runs before this one. No need to re-query.
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user found" });
    }

    if (!req.user.onboarding) {
      return res.status(403).json({
        success: false,
        message: "⛔ Access Denied: onboarding required",
        error_code: "WORKSPACE_LOCKED"
      });
    }

    next();

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error in Auth Check" });
  }
};

module.exports = isOnboarded;