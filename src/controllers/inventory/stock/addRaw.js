const Item = require("../../../models/inventory/items.inventory");
const { uploadImage } = require("../../../services/cloudinary");
const fs = require("fs").promises;

exports.addRaw = async (req, res) => {
  let shouldDeleteFile = true;
  try {
    const userId = req.user._id;
    const {
      name,
      unit,
      costPrice,
      sellingPrice,
      reorderLevel,
      location,
      weight,
      brand,
      canBeSold,
      canBePurchased,
      canBeManufactured,
    } = req.body;

    // Validation: Required fields
    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name and unit are required fields.",
      });
    }

    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name must be a non-empty string.",
      });
    }

    if (
      costPrice !== undefined &&
      (isNaN(costPrice) || Number(costPrice) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Cost price must be a non-negative number.",
      });
    }

    if (
      sellingPrice !== undefined &&
      (isNaN(sellingPrice) || Number(sellingPrice) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be a non-negative number.",
      });
    }

    const existingItem = await Item.findOne({
      businessId: userId,
      name: name.trim(),
    });
    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: "An item with this name already exists in your inventory.",
      });
    }

    const imageUrl = (await uploadImage(req.file?.path)) || null;

    const newItem = new Item({
      businessId: userId,
      name: name.trim(),
      imageUrl: imageUrl || null,
      type: "RAW",
      unit: unit.trim(),
      costPrice: costPrice ? Number(costPrice) : null,
      sellingPrice: sellingPrice ? Number(sellingPrice) : null,
      reorderLevel: reorderLevel ? Number(reorderLevel) : 0,
      location: location ? location.trim() : undefined,
      weight: weight ? weight.trim() : undefined,
      brand: brand ? brand.trim() : undefined,
      canBeSold: canBeSold || false,
      canBePurchased: canBePurchased || false,
      canBeManufactured: canBeManufactured || false,
      isActive: true,
    });

    await newItem.save();

    shouldDeleteFile = false; // Success, don't delete the file

    res.status(201).json({
      success: true,
      message: "Raw material added successfully!",
      data: newItem,
    });
  } catch (error) {
    console.error("Add Raw Item Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An item with this name already exists in your inventory.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding raw material",
      error: error.message,
    });
  } finally {
    if (shouldDeleteFile && req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting uploaded file:", unlinkError);
      }
    }
  }
};