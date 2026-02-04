const express=require("express");
const authRouter=express.Router();
const userAuth=require("../../../controllers").userAuth;
const verify=require("../../../utils/auth");
const updateProfile = require("../../../controllers/user-auth/updateProfile");
const changePassword = require("../../../controllers/user-auth/changePassword");
const {getUserProfile }= require("../../../controllers/user-auth/getProfile");
const googleLogin=require("../../../controllers/user-auth/googleAuth");
authRouter.use('/login',userAuth.login);
authRouter.use('/signUp',userAuth.signup);
authRouter.use('/logout',verify,userAuth.logout);
authRouter.use("/google",googleLogin);

authRouter.put("/update-profile", verify, updateProfile);
authRouter.put("/change-password", verify, changePassword);
module.exports=authRouter;
