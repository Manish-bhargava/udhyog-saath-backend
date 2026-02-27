const Item = require("../../../models/inventory/items.inventory");
exports.addFinished = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, unit, costPrice, sellingPrice, reorderLevel, canBeSold, canBePurchased, canBeManufactured } = req.body;

    // Validation: Required fields
    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name and unit are required fields."
      });
    }

    // Validation: Name should be string
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name must be a non-empty string."
      });
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

    // Check if item already exists for this business
    const existingItem = await Item.findOne({ businessId: userId, name: name.trim() });
    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "An item with this name already exists in your inventory."
      });
    }

    const imageUrl = await fileUpload(req.file?.path) || null;

    // Create new finished item
    const newItem = new Item({
      businessId: userId,
      name: name.trim(),
      imageUrl: imageUrl || null,
      type: "FINISHED",
      unit: unit.trim(),
      costPrice: costPrice ? Number(costPrice) : null,
      sellingPrice: sellingPrice ? Number(sellingPrice) : null,
      reorderLevel: reorderLevel ? Number(reorderLevel) : 0,
      canBeSold: canBeSold || false,
      canBePurchased: canBePurchased || false,
      canBeManufactured: canBeManufactured || false,
      isActive: true
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      message: "Finished item added successfully!",
      data: newItem
    });

  } catch (error) {
    console.error("Add Finished Item Error:", error);

    //for race condition when two requests try to add the same item at the same time
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An item with this name already exists in your inventory."
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding finished item",
      error: error.message
    });
  }
}