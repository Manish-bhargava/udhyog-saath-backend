const Bill = require("../../models/bills");
const User=require("../../models/user");
const onboarding=require("../../models/onboarding");
exports.getSingleBill = async (req, res) => {
    try {
        const userId = req.user._id;
        const invoiceNum = req.params.invoiceNumber;

        const bill = await Bill.findOne({ 
            user: userId, 
            invoiceNumber: invoiceNum 
        });
        let billObj = bill.toObject();
        if(!userId){
            return res.json({msg:"user not found"});
        }
        userInfo=await onboarding.findOne({user:userId});
      
        console.log(userInfo)
    //   billObj.SenderName=userInfo.name;
    //   billObj.Senderemail=userInfo.email;



        if (!bill) {
            return res.status(404).json({
                success: false,
                message: `Bill #${invoiceNum} not found.`
            });
        }
       console.log(bill);
        res.status(200).json({
            success: true,
            bill: billObj
        });

    } catch (error) {
        console.error("View Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};