const Warehouse = require("../../../models/inventory/warehouse.inventory");

exports.deleteWarehouse = async (req, res) => {
  try {
    const businessId = req.user._id;
    const warehouseId = req.params.id;

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID is required.",
      });
    }

    const deleted = await Warehouse.findOneAndDelete({ _id: warehouseId, businessId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found or you don't have permission to delete it.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Warehouse deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete Warehouse Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting warehouse",
      error: error.message,
    });
  }
};