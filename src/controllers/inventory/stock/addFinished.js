const Item = require("../../../models/inventory/items.inventory");
const { uploadImage } = require("../../../services/cloudinary");
const fs = require("fs").promises;
const Warehouse = require("../../../models/inventory/warehouse.inventory");
const { adjustInventory, getOrCreateDefaultWarehouse } = require("../../../utils/inventory");

exports.addFinished = async (req, res) => {
  let shouldDeleteFile = true;
  try {
    const userId = req.user._id;
    const {
      name,
      unit,
      costPrice,
      sellingPrice,
      quantity,
      reorderLevel,
      location,
      weight,
      brand,
      warehouseId,
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

    // Validation: Name should be string
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Item name must be a non-empty string.",
      });
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

    let catalogWarehouseId = null;
    if (warehouseId) {
      const wh = await Warehouse.findOne({ _id: warehouseId, businessId: userId, isActive: true });
      if (wh) catalogWarehouseId = wh._id;
    }
    if (!catalogWarehouseId) {
      const { _id } = await getOrCreateDefaultWarehouse(userId);
      catalogWarehouseId = _id;
    }

    const existingItem = await Item.findOne({
      businessId: userId,
      name: name.trim(),
      type: "FINISHED",
      warehouseId: catalogWarehouseId,
    });
    if (existingItem) {
      return res.status(409).json({
        success: false,
        message:
          "A finished product with this name already exists in this warehouse. Pick another warehouse or edit the existing item.",
      });
    }

    const imageUrl = (await uploadImage(req.file?.path)) || null;

    const newItem = new Item({
      businessId: userId,
      name: name.trim(),
      imageUrl: imageUrl || null,
      type: "FINISHED",
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
      warehouseId: catalogWarehouseId,
    });

    await newItem.save();

    try {
      const qtyNum = quantity !== undefined && quantity !== "" ? Number(quantity) : 0;
      if (!Number.isNaN(qtyNum) && qtyNum > 0) {
        await adjustInventory({
          businessId: userId,
          warehouseId: catalogWarehouseId,
          itemId: newItem._id,
          qtyChange: qtyNum,
          transactionType: "PURCHASE",
          referenceNote: `Initial stock for ${newItem.name}`,
        });
      }
    } catch (invErr) {
      console.error("Initial inventory init error:", invErr);
    }

    shouldDeleteFile = false; // Success, don't delete the file

    res.status(201).json({
      success: true,
      message: "Finished item added successfully!",
      data: newItem,
    });
  } catch (error) {
    console.error("Add Finished Item Error:", error);

    //for race condition when two requests try to add the same item at the same time
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A finished product with this name already exists. Use a different name or edit the existing item.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while adding finished item",
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
