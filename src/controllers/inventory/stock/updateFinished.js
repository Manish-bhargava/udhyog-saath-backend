const Item = require("../../../models/inventory/items.inventory");

exports.updateFinished = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { name, unit, costPrice, sellingPrice, reorderLevel, canBeSold, canBePurchased, canBeManufactured, isActive } = req.body;

    // Validation: itemId required
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required."
      });
    }

    // Find item by ID and ensure it belongs to the user
    const item = await Item.findOne({ _id: itemId, businessId: userId });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you don't have permission to update it."
      });
    }

    // Validation: Name should be string
    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "Item name must be a non-empty string."
      });
    }

    // Check if updated name already exists for this business
    if (name && name.trim() !== item.name) {
      const existingItem = await Item.findOne({ businessId: userId, name: name.trim() });
      if (existingItem) {
        return res.status(409).json({
          success: false,
          message: "An item with this name already exists in your inventory."
        });
      }
    }

    // Validation: Prices should be non-negative numbers
    if (costPrice !== undefined && (isNaN(costPrice) || Number(costPrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Cost price must be a non-negative number."
      });
    }

    if (sellingPrice !== undefined && (isNaN(sellingPrice) || Number(sellingPrice) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be a non-negative number."
      });
    }

    // Validation: Reorder level should be non-negative
    if (reorderLevel !== undefined && (isNaN(reorderLevel) || Number(reorderLevel) < 0)) {
      return res.status(400).json({
        success: false,
        message: "Reorder level must be a non-negative number."
      });
    }

    const imageUrl = await fileUpload(req.file?.path) || item.imageUrl;
    // Update allowed fields
    if (name !== undefined) item.name = name.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (unit !== undefined) item.unit = unit.trim();
    if (costPrice !== undefined) item.costPrice = costPrice ? Number(costPrice) : null;
    if (sellingPrice !== undefined) item.sellingPrice = sellingPrice ? Number(sellingPrice) : null;
    if (reorderLevel !== undefined) item.reorderLevel = Number(reorderLevel);
    if (canBeSold !== undefined) item.canBeSold = canBeSold;
    if (canBePurchased !== undefined) item.canBePurchased = canBePurchased;
    if (canBeManufactured !== undefined) item.canBeManufactured = canBeManufactured;
    if (isActive !== undefined) item.isActive = isActive;

    await item.save();

    res.status(200).json({
      success: true,
      message: "Finished item updated successfully!",
      data: item
    });

  } catch (error) {
    console.error("Update Finished Item Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An item with this name already exists in your inventory."
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating finished item",
      error: error.message
    });
  }
};