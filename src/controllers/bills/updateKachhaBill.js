const Bill = require("../../models/bills");
const { reserveInventory, releaseReserved } = require("../../utils/inventory");
const {
  resolveFinishedItem,
  resolveLineWarehouseId,
  lineAggregateKey,
} = require("../../utils/billInventory");
const { resolveBillDate } = require("../../utils/billDate");

async function aggregateReserveQuantities(productLines, userId, billWarehouseId) {
  const map = new Map();
  for (const p of productLines || []) {
    const item = await resolveFinishedItem(userId, p);
    if (!item) continue;
    const wh = await resolveLineWarehouseId(userId, p, billWarehouseId);
    const k = lineAggregateKey(item._id, wh);
    const qty = Number(p.quantity) || 0;
    map.set(k, (map.get(k) || 0) + qty);
  }
  return map;
}

exports.updateKacchaBill = async (req, res) => {
    try {
        const userId = req.user._id;
        const billId = req.params.id;

        // 1. FETCH EXISTING BILL (Needed to get current 'billType' for tax logic)
        const existingBill = await Bill.findOne({ _id: billId, user: userId });

        if (!existingBill) {
            return res.status(404).json({ success: false, message: "Bill not found" });
        }

        // 2. PREPARE DATA FROM REQUEST
        const { 
            buyer,           // Object { clientName, clientAddress, clientGst }
            products,        // Array of objects [{name, rate, quantity}]
            discount = 0,    // Percentage (Default to 0 if not sent)
            invoiceDate,
            billDate,
            requestedInvoiceDate,
            requestedBillDate,
        } = req.body;

        // 3. CALCULATE NEW MATH
        // Use new products if sent, otherwise keep existing products
        const productsToUse = products && products.length > 0 ? products : existingBill.products;

        let newSubTotal = 0;
        
        // Recalculate Subtotal based on (Rate * Quantity)
        const processedProducts = productsToUse.map((item) => {
            const rate = Number(item.rate);
            const quantity = Number(item.quantity);
            const amount = rate * quantity;

            newSubTotal += amount;

            return {
                name: item.name,
                rate,
                quantity,
                amount,
                inventoryItemId: item.inventoryItemId || undefined,
                warehouseId: item.warehouseId || undefined,
            };
        });

        // Calculate Financials
        // Note: Logic follows your snippet (Discount is input %, stored as Amount)
        // const discountPercent = Number(discount);
        // const discountAmount = (newSubTotal * discountPercent) / 100;
        const discountAmount = Number(discount);
        const taxableValue = Math.max(0,newSubTotal - discountAmount);

        // GST Logic: If Kaccha -> 0. If Pakka -> Use existing percentage.
        const gstPercentage = existingBill.billType === 'kaccha' ? 0 : (existingBill.gstPercentage || 18);
        const taxAmount = (taxableValue * gstPercentage) / 100;
        
        const grandTotal = taxableValue + taxAmount;

        // 4. PREPARE THE UPDATE OBJECT ($set)
        const updatePayload = {
            products: processedProducts,
            subTotal: newSubTotal,
            discount: discountAmount,
            gstPercentage: gstPercentage,
            taxAmount: taxAmount,
            grandTotal: grandTotal
        };

        updatePayload.invoiceDate = resolveBillDate(
            { invoiceDate, billDate, requestedInvoiceDate, requestedBillDate },
            { fallbackDate: existingBill.invoiceDate },
        );

        // Handle Buyer Details (Only update if provided)
        if (buyer) {
            // We use dot notation to update specific fields without erasing others
            if (buyer.clientName) updatePayload["buyer.clientName"] = buyer.clientName;
            if (buyer.clientAddress) updatePayload["buyer.clientAddress"] = buyer.clientAddress;
            if (buyer.clientGst && existingBill.billType !== 'kaccha') {
                updatePayload["buyer.clientGst"] = buyer.clientGst;
            }
        }

        // 5. PERFORM THE UPDATE (Atomic & Safe)
        const updatedBill = await Bill.findByIdAndUpdate(
            billId,
            { $set: updatePayload },
            { new: true, runValidators: true } // Returns the NEW object, runs checks
        );

        if (existingBill.billType === "kaccha") {
            try {
                const oldAgg = await aggregateReserveQuantities(
                    existingBill.products,
                    userId,
                    existingBill.warehouseId,
                );
                const newAgg = await aggregateReserveQuantities(
                    processedProducts,
                    userId,
                    existingBill.warehouseId,
                );
                const keys = new Set([...oldAgg.keys(), ...newAgg.keys()]);
                for (const k of keys) {
                    const delta = (newAgg.get(k) || 0) - (oldAgg.get(k) || 0);
                    if (delta === 0) continue;
                    const at = k.lastIndexOf("@");
                    const itemId = k.slice(0, at);
                    const whId = k.slice(at + 1);
                    if (delta > 0) {
                        await reserveInventory({
                            businessId: userId,
                            warehouseId: whId,
                            itemId,
                            qty: delta,
                            referenceNote: `Update ${existingBill.invoiceNumber}`,
                        });
                    } else {
                        await releaseReserved({
                            businessId: userId,
                            warehouseId: whId,
                            itemId,
                            qty: Math.abs(delta),
                            referenceNote: `Update ${existingBill.invoiceNumber}`,
                        });
                    }
                }
            } catch (invErr) {
                console.error("Inventory reservation update error:", invErr);
            }
        }

        res.status(200).json({
            success: true,
            message: "Bill updated successfully",
            data: updatedBill
        });

    } catch (error) {
        console.error("Update Bill Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error while updating bill", 
            error: error.message 
        });
    }
};