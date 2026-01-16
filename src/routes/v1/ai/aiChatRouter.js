const express=require("express");
const aiRouter=express.Router();
const {handleUserMessage}=require("../../../controllers/ai/handleUserMessage.js");
const isOnboarded=require("../../../utils/isOnboarded");
const verify=require("../../../utils/auth");
aiRouter.post('/message',verify,isOnboarded,handleUserMessage);


module.exports=aiRouter;