const express=require("express");
const BillRouter=express.Router();
const {createBill}=require("../../../controllers/bills/createBill.js");
const {getAllBills}=require("../../../controllers/bills/getCreatedBills.js");
const isOnboarded=require("../../../utils/isOnboarded");
const verify=require("../../../utils/auth");
const {deleteBill}=require("../../../controllers/bills/deleteBill.js");
const {getSingleBill}=require("../../../controllers/bills/getSingleBill.js");
const {convertToPakka}=require("../../../controllers/bills/convertKacchaBillToPakka.js");
const {updateKacchaBill}=require("../../../controllers/bills/updateKachhaBill.js");
BillRouter.post('/create/:billType',verify,isOnboarded,createBill);
BillRouter.get("/all", verify,isOnboarded, getAllBills);
BillRouter.delete("/delete/:id", verify,isOnboarded, deleteBill);
BillRouter.post('/convert/:id', verify,isOnboarded, convertToPakka)
BillRouter.get("/:invoiceNumber", verify,isOnboarded, getSingleBill);
BillRouter.put('/update/:id', verify, updateKacchaBill);
module.exports=BillRouter;