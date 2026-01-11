const express=require("express");
const v1Router=express.Router();
const authRouter=require("../v1/auth/user.auth");
const onBoardingRouter=require("../v1/onBoarding/onboarding");
const BillRouter = require("../v1/bills/BillsRouter");
const aiRouter = require("../v1/ai/aiChatRouter");
v1Router.use('/auth',authRouter);
v1Router.use('/user',onBoardingRouter);
v1Router.use('/bill',BillRouter)
v1Router.use('/ai',aiRouter);
module.exports=v1Router;