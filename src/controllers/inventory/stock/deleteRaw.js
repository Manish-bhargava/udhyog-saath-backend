const Item = require("../../../models/inventory/items.inventory");

exports.deleteRaw = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required."
      });
    }

    const deletedItem = await Item.findOneAndDelete({
      _id: itemId,
      businessId: userId,
      type: "RAW"
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Raw material not found or you don't have permission to delete it."
      });
    }

    res.status(200).json({
      success: true,
      message: "Raw material deleted successfully!",
      data: deletedItem
    });
  } catch (error) {
    console.error("Delete Raw Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting raw material",
      error: error.message
    });
  }
};