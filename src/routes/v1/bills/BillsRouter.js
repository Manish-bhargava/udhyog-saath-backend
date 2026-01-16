const express=require("express");
const BillRouter=express.Router();
const {createBill}=require("../../../controllers/bills/createBill.js");
const {getAllBills}=require("../../../controllers/bills/getCreatedBills.js");
const isOnboarded=require("../../../utils/isOnboarded");
const verify=require("../../../utils/auth");
BillRouter.post('/create/:billType',verify,isOnboarded,createBill);
BillRouter.get("/all", verify,isOnboarded, getAllBills);

module.exports=BillRouter;