const Warehouse = require("../../../models/inventory/warehouse.inventory");

exports.addWarehouse = async (req, res) => {
  try {
    const businessId = req.user._id;
    const { name, location } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Warehouse name is required.",
      });
    }

    // duplicate check within business
    const exists = await Warehouse.findOne({ businessId, name: name.trim() });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "A warehouse with this name already exists.",
      });
    }

    const warehouse = new Warehouse({
      businessId,
      name: name.trim(),
      location: location ? location.trim() : undefined,
    });

    await warehouse.save();

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    console.error("Add Warehouse Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating warehouse",
      error: error.message,
    });
  }
};