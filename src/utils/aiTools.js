const Bill = require("../models/bills");
const mongoose = require("mongoose");

const aiTools = {
    get_total_revenue: async ({ userId }) => {
        const result = await Bill.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, total: { $sum: "$grandTotal" } } }
        ]);
        return { total_revenue: result[0]?.total || 0, currency: "INR" };
    },

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

    get_tax_summary: async ({ userId }) => {
        const result = await Bill.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), billType: "pakka" } },
            { $group: { _id: null, totalTax: { $sum: "$taxAmount" } } }
        ]);
        return { total_gst: result[0]?.totalTax || 0 };
    }
};

module.exports = aiTools;