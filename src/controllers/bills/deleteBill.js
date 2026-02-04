const Bill = require("../../models/bills"); // Make sure path is correct

exports.deleteBill = async (req, res) => {
    try {
        // 1. Get Bill ID and Current User
        // Assuming your route is something like /api/v1/bill/delete/:id
        const billId = req.params.id; 
        const userId = req.user.id;
  console.log(userId);
        // 2. Validate Bill ID (Optional but good practice)
        if (!billId) {
             return res.status(400).json({ 
                success: false, 
                message: "Bill ID is required." 
            });
        }

        // 3. FIND AND DELETE SAFELY
        // Crucial: We query by both '_id' AND 'user'. 
        // This ensures a user can only delete their OWN bills.
        const deletedBill = await Bill.findOneAndDelete({ 
            invoiceNumber: billId, 
            user: userId 
        });

        // 4. CHECK IF SUCCESSFUL
        // If deletedBill is null, it means either the bill doesn't exist 
        // OR it belongs to a different user.
        if (!deletedBill) {
            return res.status(404).json({ 
                success: false, 
                message: "Bill not found or you are not authorized to delete this bill." 
            });
        }

        // 5. SEND SUCCESS RESPONSE
        res.status(200).json({
            success: true,
            message: "Bill deleted successfully!",
            data: {
                _id: deletedBill._id,
                invoiceNumber: deletedBill.invoiceNumber
            }
        });

    } catch (error) {
        console.error("Delete Bill Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error while deleting bill", 
            error: error.message 
        });
    }
};