const Bill = require("../../models/bills");

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
            discount = 0     // Percentage (Default to 0 if not sent)
        } = req.body;

        // 3. CALCULATE NEW MATH
        // Use new products if sent, otherwise keep existing products
        const productsToUse = products && products.length > 0 ? products : existingBill.products;

        let newSubTotal = 0;
        
        // Recalculate Subtotal based on (Rate * Quantity)
        const processedProducts = productsToUse.map(item => {
            const rate = Number(item.rate);
            const quantity = Number(item.quantity);
            const amount = rate * quantity;
            
            newSubTotal += amount;

            return { 
                name: item.name, 
                rate: rate, 
                quantity: quantity, 
                amount: amount 
            };
        });

        // Calculate Financials
        // Note: Logic follows your snippet (Discount is input %, stored as Amount)
        const discountPercent = Number(discount);
        const discountAmount = (newSubTotal * discountPercent) / 100;
        
        const taxableValue = newSubTotal - discountAmount;

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