const Item = require("../../../models/inventory/items.inventory");

exports.deleteFinished = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    // Validation: itemId is required
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required."
      });
    }

    // Find and delete the finished item
    const deletedItem = await Item.findOneAndDelete({
      _id: itemId,
      businessId: userId,
      type: "FINISHED"
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Finished item not found or you don't have permission to delete it."
      });
    }

    res.status(200).json({
      success: true,
      message: "Finished item deleted successfully!",
      data: deletedItem
    });

  } catch (error) {
    console.error("Delete Finished Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting finished item",
      error: error.message
    });
  }
}