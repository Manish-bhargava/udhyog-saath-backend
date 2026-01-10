const Bill = require('../../models/bills');

exports.getAllBills = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.query; // Get ?type=... from URL
           console.log(type);
        // 1. Build the Query Object
        let query = { user: userId };

        // 2. If user sent a filter (e.g., ?type=Pakka or ?type=pakka)
        if (type) {
            // Convert to lowercase to match your Schema enum ["pakka", "kaccha"]
            const typeLower = type.toLowerCase();

            // Validate against your allowed values
            if (["pakka", "kaccha"].includes(typeLower)) {
                query.billType = typeLower;
            }
        }

        // 3. Fetch Data
        const bills = await Bill.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bills.length,
            filter: type || "All",
            data: bills
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};