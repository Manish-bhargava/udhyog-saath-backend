const Bill = require("../../models/bills"); // Make sure path is correct
const { adjustInventory, releaseReserved } = require("../../utils/inventory");
const {
  resolveFinishedItem,
  resolveLineWarehouseId,
} = require("../../utils/billInventory");

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

        try {
          for (const prod of deletedBill.products || []) {
            const item = await resolveFinishedItem(userId, prod);
            if (!item) continue;

            const qty = Number(prod.quantity) || 0;
            if (qty <= 0) continue;

            const lineWh = await resolveLineWarehouseId(userId, prod, deletedBill.warehouseId);

            if (deletedBill.billType === "pakka") {
              await adjustInventory({
                businessId: userId,
                warehouseId: lineWh,
                itemId: item._id,
                qtyChange: qty,
                transactionType: "ADJUSTMENT",
                referenceNote: `Revert delete ${deletedBill.invoiceNumber}`,
              });
            } else if (deletedBill.billType === "kaccha") {
              await releaseReserved({
                businessId: userId,
                warehouseId: lineWh,
                itemId: item._id,
                qty,
                referenceNote: `Delete ${deletedBill.invoiceNumber}`,
              });
            }
          }
        } catch (invErr) {
          console.error("Inventory delete revert error:", invErr);
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