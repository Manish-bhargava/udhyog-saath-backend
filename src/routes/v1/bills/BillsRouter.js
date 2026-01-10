const express=require("express");
const BillRouter=express.Router();
const {createBill}=require("../../../controllers/bills/createBill.js");
const {getAllBills}=require("../../../controllers/bills/getCreatedBills.js");

const verify=require("../../../utils/auth");
BillRouter.post('/create/:billType',verify,createBill);
BillRouter.get("/all", verify, getAllBills);

module.exports=BillRouter;