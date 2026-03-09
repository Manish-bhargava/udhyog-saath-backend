const Warehouse = require("../../../models/inventory/warehouse.inventory");

exports.updateWarehouse = async (req, res) => {
  try {
    const businessId = req.user._id;
    const warehouseId = req.params.id;
    const { name, location, isActive } = req.body;

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Warehouse ID is required.",
      });
    }

    const warehouse = await Warehouse.findOne({ _id: warehouseId, businessId });
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found or you don't have permission to update it.",
      });
    }

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Warehouse name must be a non-empty string.",
        });
      }
      if (name.trim() !== warehouse.name) {
        const exists = await Warehouse.findOne({ businessId, name: name.trim() });
        if (exists) {
          return res.status(409).json({
            success: false,
            message: "A warehouse with this name already exists.",
          });
        }
      }
      warehouse.name = name.trim();
    }

    if (location !== undefined) warehouse.location = location.trim();
    if (isActive !== undefined) warehouse.isActive = isActive;

    await warehouse.save();

    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    console.error("Update Warehouse Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating warehouse",
      error: error.message,
    });
  }
};