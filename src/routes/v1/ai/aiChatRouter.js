const express=require("express");
const aiRouter=express.Router();
const {handleUserMessage}=require("../../../controllers/ai/handleUserMessage.js");

const verify=require("../../../utils/auth");
aiRouter.post('/message',verify,handleUserMessage);


module.exports=aiRouter;