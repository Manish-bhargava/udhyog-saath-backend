const Bill = require("../../models/bills"); // Make sure path is correct
const Onboarding = require("../../models/onboarding"); // Make sure path is correct

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
        // Capitalize first letter for DB enum ("Pakka" or "Kaccha")
       


        // 2. FETCH SELLER SNAPSHOT (The "Onboarding" Data)
        const sellerProfile = await Onboarding.findOne({ user: userId });

        // Gatekeeper: You cannot make a Pakka bill without a profile
        if (billType === "pakka" && !sellerProfile) {
            return res.status(400).json({ 
                success: false, 
                message: "You must complete your Business Profile (Onboarding) before creating a Pakka Bill." 
            });
        }

        // 3. PREPARE SELLER DETAILS OBJECT
        // We copy these values PERMANENTLY into the bill.
        // Using optional chaining (?.) and OR (||) to handle empty fields safely.
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
            
            // Bank Details (Needed for the footer of the bill)
            bankName: sellerProfile?.BankDetails?.bankName || "",
            accountNumber: sellerProfile?.BankDetails?.accountNumber || "",
            IFSC: sellerProfile?.BankDetails?.IFSC || "",
            branchName: sellerProfile?.BankDetails?.branchName || ""
        };


        // 4. PROCESS BODY DATA (Buyer + Products)
        const { 
            buyer, 
            products, 
            gstPercentage = 0, 
            discount = 0 
        } = req.body;

        // A. Validate Products Array
        if (!products || products.length === 0) {
            return res.status(400).json({ success: false, message: "Please add at least one product." });
        }

        // B. Calculate Product Totals
        let subTotal = 0;
        
        const processedProducts = products.map(item => {
            // Ensure numbers are actually numbers
            const rate = Number(item.rate);
            const quantity = Number(item.quantity);
            const amount = rate * quantity;
            
            subTotal += amount; // Add to running total
            
            return { 
                name: item.name,
                rate: rate,
                quantity: quantity,
                amount: amount
            };
        });

        // C. Calculate Final Amounts
        // Logic: (Subtotal - Discount) + Tax
        const taxableAmount = subTotal - Number(discount);
        const taxAmount = (taxableAmount * Number(gstPercentage)) / 100;
        const grandTotal = taxableAmount + taxAmount;


        // 5. GENERATE INVOICE NUMBER
        // Simple format: INV-TIMESTAMP-RANDOM (Ensures uniqueness)
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;


        // 6. CREATE & SAVE THE BILL
        const newBill = new Bill({
            user: userId,
            billType: billType,
            invoiceNumber: invoiceNumber,
            invoiceDate: Date.now(),
            
            // The Important Part: The Snapshot
            sellerDetails: sellerDetailsSnapshot,

            buyer: buyer,
            products: processedProducts,

            // Math
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
        res.status(500).json({ 
            success: false, 
            message: "Server Error while creating bill", 
            error: error.message 
        });
    }
};