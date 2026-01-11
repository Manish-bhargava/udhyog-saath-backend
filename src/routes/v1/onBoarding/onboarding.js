const express=require("express");
const {userOnboarding}=require("../../../controllers/onboarding/user.onboarding");
const verify=require("../../../utils/auth");
const onBoardingRouter=express.Router();
onBoardingRouter.post('/onboarding',verify,userOnboarding);
module.exports=onBoardingRouter;