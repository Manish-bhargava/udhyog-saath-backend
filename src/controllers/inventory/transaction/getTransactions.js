const Transaction = require("../../../models/inventory/transaction.inventory");

// GET /inventory/transactions/get
// optional query params: warehouseId, itemId, type
exports.getTransactions = async (req, res) => {
  try {
    const businessId = req.user._id;
    const { warehouseId, itemId, type } = req.query;

    const filter = { businessId };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (itemId) filter["items.itemId"] = itemId;
    if (type) filter.type = type;

    const list = await Transaction.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: error.message,
    });
  }
};