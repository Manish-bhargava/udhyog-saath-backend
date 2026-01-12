const express=require("express");
const {userOnboarding}=require("../../../controllers/onboarding/user.onboarding");
const {getUserProfile}=require("../../../controllers/user-auth/getProfile");
const verify=require("../../../utils/auth");
const onBoardingRouter=express.Router();
onBoardingRouter.post('/onboarding',verify,userOnboarding);
onBoardingRouter.get("/profile", verify, getUserProfile );
module.exports=onBoardingRouter;