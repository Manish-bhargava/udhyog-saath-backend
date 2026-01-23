const Bill = require("../../models/bills"); 
const Onboarding = require("../../models/onboarding"); 

exports.createBill = async (req, res) => {
    try {
        // 1. Get User and Bill Type
        const userId = req.user._id;
        const billType = req.params.billType;
          
        // Validate Type
        if (billType !== "pakka" && billType !== "kaccha") {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid bill type. Use /create/pakka or /create/kaccha" 
            });
        }

        const sellerProfile = await Onboarding.findOne({ user: userId });

        // 2. Gatekeeper: You cannot make a Pakka bill without a profile
        if (billType === "pakka" && !sellerProfile) {
            return res.status(400).json({ 
                success: false, 
                message: "You must complete your Business Profile (Onboarding) before creating a Pakka Bill." 
            });
        }

        // 3. PREPARE SELLER DETAILS OBJECT
        const sellerDetailsSnapshot = {
            companyName: sellerProfile?.company?.companyName || "",
            companyEmail: sellerProfile?.company?.companyEmail || "",
            companyAddress: sellerProfile?.company?.companyAddress || "",
            companyPhone: sellerProfile?.company?.companyPhone || "",
            companyLogo: sellerProfile?.company?.companyLogo || "",
            companyDescription: sellerProfile?.company?.companyDescription || "",
            GST: sellerProfile?.company?.GST || "",
            companyStamp: sellerProfile?.company?.companyStamp || "",
            companySignature: sellerProfile?.company?.companySignature || "",
            
            // Bank Details
            bankName: sellerProfile?.BankDetails?.bankName || "",
            accountNumber: sellerProfile?.BankDetails?.accountNumber || "",
            IFSC: sellerProfile?.BankDetails?.IFSC || "",
            branchName: sellerProfile?.BankDetails?.branchName || ""
        };

        // 4. PROCESS BODY DATA
        const { 
            buyer, 
            products, 
            gstPercentage = 0, 
            discount = 0 
        } = req.body;

        // A. Validate Products
        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: "Please add at least one product." });
        }

        // B. Calculate Product Totals
        let subTotal = 0;
        
        const processedProducts = products.map(item => {
            const rate = Number(item.rate);
            const quantity = Number(item.quantity);
            const amount = rate * quantity;
            subTotal += amount; 
            
            return { 
                name: item.name,
                rate: rate,
                quantity: quantity,
                amount: amount
            };
        });

        // C. Calculate Final Amounts
        const taxableAmount = subTotal - Number(discount);
        const taxAmount = (taxableAmount * Number(gstPercentage)) / 100;
        const grandTotal = taxableAmount + taxAmount;

        // ============================================================
        // 5. GENERATE SEQUENTIAL INVOICE NUMBER (FIXED)
        // ============================================================
        
        // Find the last bill created by THIS user only
        const lastBill = await Bill.findOne({ user: userId })
            .sort({ createdAt: -1 }); // Sort by newest first

        let nextInvoiceNumber = "1"; // Default for a brand new user

        if (lastBill && lastBill.invoiceNumber) {
            // Check if the previous invoice number is a number (to avoid crashing on old string IDs)
            const lastNum = parseInt(lastBill.invoiceNumber, 10);
            
            if (!isNaN(lastNum)) {
                nextInvoiceNumber = (lastNum + 1).toString();
            } else {
                // If your DB has old random IDs like "INV-84738", we restart at 1 or handle gracefully
                nextInvoiceNumber = "1"; 
            }
        }

        // 6. CREATE & SAVE THE BILL
        const newBill = new Bill({
            user: userId,
            billType: billType,
            invoiceNumber: nextInvoiceNumber, // Now it is 1, 2, 3...
            invoiceDate: Date.now(),
            sellerDetails: sellerDetailsSnapshot, // Ensure Schema has this field!
            buyer: buyer,
            products: processedProducts,
            gstPercentage: Number(gstPercentage),
            discount: Number(discount),
            subTotal: subTotal,
            taxAmount: taxAmount,
            grandTotal: grandTotal
        });

        await newBill.save();

        // 7. SEND SUCCESS RESPONSE
        res.status(201).json({
            success: true,
            message: `${billType} Bill created successfully!`,
            data: newBill
        });

    } catch (error) {
        console.error("Create Bill Error:", error);

        // Handle Rare Race Condition (Two bills created at exact same time)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A bill was generated at the exact same moment. Please try again."
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Server Error while creating bill", 
            error: error.message 
        });
    }
};