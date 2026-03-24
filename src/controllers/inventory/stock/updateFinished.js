const Item = require("../../../models/inventory/items.inventory");
const Warehouse = require("../../../models/inventory/warehouse.inventory");
const { uploadImage } = require("../../../services/cloudinary");
const fs = require("fs").promises;

exports.updateFinished = async (req, res) => {
  let shouldDeleteFile = true;
  try {
    const userId = req.user._id;
    const itemId = req.params.id;
    const {
      name,
      unit,
      costPrice,
      sellingPrice,
      reorderLevel,
      brand,
      location,
      weight,
      canBeSold,
      canBePurchased,
      canBeManufactured,
      isActive,
      warehouseId,
    } = req.body;

    // Validation: itemId required
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required.",
      });
    }

    // Find item by ID and ensure it belongs to the user
    const item = await Item.findOne({
      _id: itemId,
      businessId: userId,
      type: "FINISHED",
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you don't have permission to update it.",
      });
    }

    // Validation: Name should be string
    if (
      name !== undefined &&
      (typeof name !== "string" || name.trim() === "")
    ) {
      return res.status(400).json({
        success: false,
        message: "Item name must be a non-empty string.",
      });
    }

    let nextWarehouseId = item.warehouseId;
    if (warehouseId !== undefined && warehouseId !== null && warehouseId !== "") {
      const wh = await Warehouse.findOne({
        _id: warehouseId,
        businessId: userId,
        isActive: true,
      });
      if (!wh) {
        return res.status(400).json({
          success: false,
          message: "Invalid warehouse for this business.",
        });
      }
      nextWarehouseId = wh._id;
    }

    const nextName = name !== undefined ? name.trim() : item.name;
    const whChanging =
      warehouseId !== undefined &&
      String(nextWarehouseId || "") !== String(item.warehouseId || "");
    const nameChanging = name !== undefined && name.trim() !== item.name;
    if (nameChanging || whChanging) {
      const existingItem = await Item.findOne({
        businessId: userId,
        name: nextName,
        type: "FINISHED",
        warehouseId: nextWarehouseId,
        _id: { $ne: item._id },
      });
      if (existingItem) {
        return res.status(409).json({
          success: false,
          message:
            "Another finished product with this name already exists in that warehouse.",
        });
      }
    }

    // Validation: Prices should be non-negative numbers
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

    // Validation: Reorder level should be non-negative
    if (
      reorderLevel !== undefined &&
      (isNaN(reorderLevel) || Number(reorderLevel) < 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Reorder level must be a non-negative number.",
      });
    }

    const imageUrl = (await uploadImage(req.file?.path)) || item.imageUrl;

    // Update allowed fields
    if (name !== undefined) item.name = name.trim();
    if (imageUrl !== undefined) item.imageUrl = imageUrl;
    if (unit !== undefined) item.unit = unit.trim();
    if (costPrice !== undefined)
      item.costPrice = costPrice ? Number(costPrice) : null;
    if (sellingPrice !== undefined)
      item.sellingPrice = sellingPrice ? Number(sellingPrice) : null;
    if (reorderLevel !== undefined) item.reorderLevel = Number(reorderLevel);
    if (canBeSold !== undefined) item.canBeSold = canBeSold;
    if (canBePurchased !== undefined) item.canBePurchased = canBePurchased;
    if (canBeManufactured !== undefined)
      item.canBeManufactured = canBeManufactured;
    if (isActive !== undefined) item.isActive = isActive;
    if (brand !== undefined) item.brand = brand.trim();
    if (location !== undefined) item.location = location.trim();
    if (weight !== undefined) item.weight = weight.trim();
    if (warehouseId !== undefined) item.warehouseId = nextWarehouseId;

    await item.save();

    shouldDeleteFile = false; // Success, don't delete the file

    res.status(200).json({
      success: true,
      message: "Finished item updated successfully!",
      data: item,
    });
  } catch (error) {
    console.error("Update Finished Item Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another finished product with this name already exists. Choose a different name.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while updating finished item",
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
