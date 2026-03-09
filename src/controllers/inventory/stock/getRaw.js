const Item = require("../../../models/inventory/items.inventory.js");

exports.getRaw = async (req, res) => {
  try {
    const businessId = req.user._id;

    const rawItems = await Item.find({
      businessId,
      type: "RAW",
      isActive: true,
    }).select("-__v");

    res.status(200).json({
      success: true,
      data: rawItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching raw materials",
      error: error.message,
    });
  }
};