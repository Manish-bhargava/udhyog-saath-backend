const jwt = require("jsonwebtoken");
const userModel = require("../models/user.js");

const verify = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        console.log(req.cookies);
        if (!token) {
            return res.status(401).send("User is not verified");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECREAT_KEY);
        const email = decoded.email;

        const user = await userModel.findOne({ email });
        
        if (!user) {
            return res.status(401).send("User is not verified");
        }

        req.user = user;
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).send("User is not verified");
    }
};

module.exports = verify;