// ... existing imports
const Bill = require("../../models/bills"); // Adjust path as needed
const mongoose = require("mongoose");
const { adjustInventory, releaseReserved } = require("../../utils/inventory");
const {
  resolveFinishedItem,
  resolveLineWarehouseId,
} = require("../../utils/billInventory");
const { resolveBillDate } = require("../../utils/billDate");
exports.convertToPakka = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("billId param:", req.params.id);
    console.log("type:", typeof req.params.id);
    const billId = new mongoose.Types.ObjectId(req.params.id);
    const {
      clientAddress,
      clientGst,
      gstPercentage,
    } = req.body;

    // 1. FIND THE EXISTING KACCHA BILL
    const bill = await Bill.findOne({ _id: billId, user: userId });

    if (!bill) {
      return res
        .status(404)
        .json({ success: false, message: "Bill not found" });
    }

    if (bill.billType === "pakka") {
      return res
        .status(400)
        .json({
          success: false,
          message: "This bill is already a Pakka Invoice.",
        });
    }

    // 2. VALIDATE REQUIRED FIELDS FOR PAKKA
    // If the original bill didn't have address/GST, the user MUST send them now
    const finalAddress = clientAddress || bill.buyer.clientAddress;
    const finalGst = clientGst || bill.buyer.clientGst;

    if (!finalAddress || !finalGst) {
      return res.status(400).json({
        success: false,
        message:
          "To convert to Pakka Bill, Client Address and GST Number are required.",
      });
    }

    // 3. GENERATE NEW SEQUENTIAL INVOICE NUMBER
    // We need the next number in the "Pakka" sequence, not the old Kaccha number
    const lastPakkaBill = await Bill.findOne({
      user: userId,
      billType: "pakka",
    }).sort({ createdAt: -1 });

    let nextInvoiceNumber = "1";

    if (lastPakkaBill && lastPakkaBill.invoiceNumber) {
      // Logic to extract number from string (e.g., "INV-105" -> 105)
      // Assuming your format is like "INV-105" or just "105"
      const parts = lastPakkaBill.invoiceNumber.match(/(\d+)(?!.*\d)/); // Finds last number
      if (parts && parts[0]) {
        const lastNum = parseInt(parts[0], 10);
        nextInvoiceNumber = (lastNum + 1).toString();
      }
    }

    // 4. RECALCULATE TOTALS (Apply GST)
    // Use the new GST % passed from frontend, or default to 18 (or keep existing)
    const newGstPercentage =
      gstPercentage !== undefined
        ? Number(gstPercentage)
        : bill.gstPercentage || 18;

    // Calculate
    const taxableAmount = bill.subTotal - bill.discount;
    const newTaxAmount = (taxableAmount * newGstPercentage) / 100;
    const newGrandTotal = taxableAmount + newTaxAmount;

    const invoiceDate = resolveBillDate(req.body, { fallbackDate: bill.invoiceDate });

    // 5. UPDATE THE DOCUMENT
    bill.billType = "pakka";
    bill.invoiceNumber = nextInvoiceNumber; // Assign new ID
    bill.invoiceDate = invoiceDate;

    // Update Buyer Details
    bill.buyer.clientAddress = finalAddress;
    bill.buyer.clientGst = finalGst;

    // Update Math
    bill.gstPercentage = newGstPercentage;
    bill.taxAmount = newTaxAmount;
    bill.grandTotal = newGrandTotal;

    await bill.save();

    try {
      for (const prod of bill.products || []) {
        const item = await resolveFinishedItem(userId, prod);
        if (!item) continue;

        const lineWh = await resolveLineWarehouseId(userId, prod, bill.warehouseId);
        const qty = Number(prod.quantity) || 0;

        await releaseReserved({
          businessId: userId,
          warehouseId: lineWh,
          itemId: item._id,
          qty,
          referenceNote: `Convert ${bill.invoiceNumber}`,
        });

        await adjustInventory({
          businessId: userId,
          warehouseId: lineWh,
          itemId: item._id,
          qtyChange: -qty,
          transactionType: "SALE",
          referenceNote: `Converted to Pakka ${bill.invoiceNumber}`,
        });
      }
    } catch (invErr) {
      console.error("Inventory conversion error:", invErr);
    }

    res.status(200).json({
      success: true,
      message: "Successfully converted to Pakka Bill!",
      data: bill,
    });
  } catch (error) {
    console.error("Conversion Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
