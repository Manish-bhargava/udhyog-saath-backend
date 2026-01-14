const Bill = require("../../models/bills"); 
const Onboarding = require("../../models/onboarding");

exports.createBill = async (req, res) => {
    try {
        const userId = req.user._id;
        // We get the type from the URL parameter (e.g., /create/kaccha)
        const billType = req.params.billType; 
          
        // 1. Validation
        if (billType !== "pakka" && billType !== "kaccha") {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid bill type. Use /create/pakka or /create/kaccha" 
            });
        }

        // 2. Fetch Seller Profile
        const sellerProfile = await Onboarding.findOne({ user: userId });

     
        if (billType === "pakka" && !sellerProfile) {
            return res.status(400).json({ 
                success: false, 
                message: "You must complete your Business Profile before creating a Pakka Bill." 
            });
        }

        // 3. Prepare Seller Snapshot (The Logic You Requested)
        // If Kaccha: Force GST, Signatures, and Bank Info to be EMPTY.
        // If Pakka: Include everything.
        
        let sellerDetailsSnapshot = {};

        if (billType === "kaccha") {
            // KACCHA: Only basic contact info. No Legal/Tax info.
            sellerDetailsSnapshot = {
                companyName: sellerProfile?.company?.companyName || "",
                companyPhone: sellerProfile?.company?.companyPhone || "",
                companyAddress: sellerProfile?.company?.companyAddress || "",
                // EXPLICITLY EMPTY FOR KACCHA
                companyEmail: "",
                companyLogo: "",
                GST: "", 
                companySignature: "",
                companyStamp: "",
                bankName: "",
                accountNumber: "",
                IFSC: "",
                branchName: ""
            };
        } else {
            // PAKKA: Full Legal Details
            sellerDetailsSnapshot = {
                companyName: sellerProfile?.company?.companyName || "",
                companyEmail: sellerProfile?.company?.companyEmail || "",
                companyAddress: sellerProfile?.company?.companyAddress || "",
                companyPhone: sellerProfile?.company?.companyPhone || "",
                companyLogo: sellerProfile?.company?.companyLogo || "",
                GST: sellerProfile?.company?.GST || "",
                companySignature: sellerProfile?.company?.companySignature || "",
                companyStamp: sellerProfile?.company?.companyStamp || "",
                bankName: sellerProfile?.BankDetails?.bankName || "",
                accountNumber: sellerProfile?.BankDetails?.accountNumber || "",
                IFSC: sellerProfile?.BankDetails?.IFSC || "",
                branchName: sellerProfile?.BankDetails?.branchName || ""
            };
        }

        // 4. Process Request Body
        const { 
            buyer, 
            products, 
            gstPercentage = 0, // This will be ignored for Kaccha
            discount = 0       // This is the percentage (e.g., 5.0)
        } = req.body;

        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: "Please add at least one product." });
        }

        // 5. Force Values based on Bill Type
        // If Kaccha -> GST is ALWAYS 0. Buyer GST is removed.
        const finalGstPercentage = billType === "kaccha" ? 0 : Number(gstPercentage);
        
        const finalBuyer = {
            clientName: buyer.clientName,
            clientAddress: buyer.clientAddress,
            // If Kaccha, force GST to empty string
            clientGst: billType === "kaccha" ? "" : (buyer.clientGst || "")
        };

        // 6. Calculate Math
        let subTotal = 0;
        const processedProducts = products.map(item => {
            const rate = Number(item.rate);
            const quantity = Number(item.quantity);
            const amount = rate * quantity;
            subTotal += amount;
            return { name: item.name, rate, quantity, amount };
        });

        // A. Calculate Discount Amount (from Percentage)
        const discountPercent = Number(discount);
        const discountAmount = (subTotal * discountPercent) / 100;

        // B. Calculate Tax (on the discounted amount)
        const taxableValue = subTotal - discountAmount;
        const taxAmount = (taxableValue * finalGstPercentage) / 100;

        // C. Grand Total
        const grandTotal = taxableValue + taxAmount;

        // 7. Generate Invoice Number
        // KACH for Kaccha, INV for Pakka
        const prefix = billType === "kaccha" ? "KACH" : "INV";
        const invoiceNumber = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 8. Save Bill
        const newBill = new Bill({
            user: userId,
            billType: billType,
            invoiceNumber: invoiceNumber,
            invoiceDate: Date.now(),
            
            sellerDetails: sellerDetailsSnapshot, // Will be empty/basic for Kaccha
            buyer: finalBuyer,                    // Will have no GST for Kaccha
            products: processedProducts,

            gstPercentage: finalGstPercentage,    // Will be 0 for Kaccha
            discount: discountAmount,             // Stores the calculated AMOUNT
            subTotal: subTotal,
            taxAmount: taxAmount,                 // Will be 0 for Kaccha
            grandTotal: grandTotal
        });

        await newBill.save();

        res.status(201).json({
            success: true,
            message: `${billType === 'pakka' ? 'Pakka' : 'Kaccha'} Bill created successfully!`,
            data: newBill
        });

    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server Error while creating bill", 
            error: error.message 
        });
    }
};