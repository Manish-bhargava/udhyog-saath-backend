const Warehouse = require("../../../models/inventory/warehouse.inventory");

exports.getWarehouses = async (req, res) => {
  try {
    const businessId = req.user._id;
    const list = await Warehouse.find({ businessId }).select("-__v");
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error("Get Warehouses Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching warehouses",
      error: error.message,
    });
  }
};