const Bill = require("../models/bills"); // Check if your file is 'bill' or 'bills'
const mongoose = require("mongoose");

const aiTools = {
    // --- 1. GET TOTAL REVENUE ---
    get_total_revenue: async ({ userId }) => {
        const result = await Bill.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);
        return { total_revenue: result[0]?.total || 0, currency: "INR" };
    },

    // --- 2. GET TOP PRODUCTS ---
    get_top_products: async ({ userId }) => {
        const result = await Bill.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $unwind: "$products" },
            { $group: { _id: "$products.name", revenue: { $sum: "$products.amount" }, qty: { $sum: "$products.quantity" } } },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);
        return { top_products: result };
    },

    // --- 3. GET TAX SUMMARY ---
    get_tax_summary: async ({ userId }) => {
        const result = await Bill.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), billType: "pakka" } },
            { $group: { _id: null, totalTax: { $sum: "$taxAmount" } } }
        ]);
        return { total_gst: result[0]?.totalTax || 0 };
    },

    // --- 4. (NEW) GET DAILY SALES REPORT WITH CUSTOMER NAMES ---
    get_daily_sales_report: async ({ userId, startDate, endDate }) => {
        try {
            // Construct Date Range (Start of day to End of day)
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            // If endDate is provided, use it; otherwise, default to the same startDate (1 day)
            const end = endDate ? new Date(endDate) : new Date(startDate);
            end.setHours(23, 59, 59, 999);

            // Fetch specific fields: Number, Customer Name, Amount, Type
            const bills = await Bill.find({
                user: new mongoose.Types.ObjectId(userId),
                invoiceDate: { $gte: start, $lte: end }
            }).select("invoiceNumber invoiceDate buyer.clientName grandTotal billType");

            // Format the data for the AI to read easily
            const formattedSales = bills.map(b => ({
                invoice: b.invoiceNumber,
                date: b.invoiceDate.toLocaleDateString('en-IN'),
                customer: b.buyer.clientName, // <--- The specific data you wanted
                amount: b.grandTotal,
                type: b.billType
            }));

            return {
                period: `${startDate} to ${endDate || startDate}`,
                total_sales_count: bills.length,
                transactions: formattedSales
            };

        } catch (error) {
            console.error("Daily Sales Tool Error:", error);
            return { error: "Could not fetch daily sales data." };
        }
    },

    // --- 5. GET MONTHLY COMPARISON ---
    get_monthly_comparison: async ({ userId }) => {
        const result = await Bill.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: { 
                        month: { $month: "$invoiceDate" }, 
                        year: { $year: "$invoiceDate" } 
                    },
                    total: { $sum: "$grandTotal" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } }, // Sort newest first
            { $limit: 6 } // Get last 6 months
        ]);
        
        // Format for readability
        return {
            monthly_data: result.map(item => ({
                month: `${item._id.month}-${item._id.year}`,
                revenue: item.total
            }))
        };
    }
};

module.exports = aiTools;