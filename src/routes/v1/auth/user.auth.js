const express=require("express");
const authRouter=express.Router();
const userAuth=require("../../../controllers").userAuth;
const verify=require("../../../utils/auth");
authRouter.use('/login',userAuth.login);
authRouter.use('/signUp',userAuth.signup);
authRouter.use('/logout',verify,userAuth.logout);
module.exports=authRouter;