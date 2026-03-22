const Conversion = require("../../../models/inventory/conversion.inventory");
const Inventory = require("../../../models/inventory/inventory.inventory");
const Transaction = require("../../../models/inventory/transaction.inventory");
const Warehouse = require("../../../models/inventory/warehouse.inventory");

exports.performConversion = async (req, res) => {
  try {
    const businessId = req.user._id;
    const { conversionId, quantity, warehouseId } = req.body;

    // Validation
    if (!conversionId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Conversion ID and positive quantity are required.",
      });
    }

    // Get the conversion recipe
    const conversion = await Conversion.findOne({
      _id: conversionId,
      businessId
    }).populate('outputItemId inputs.itemId');

    if (!conversion) {
      return res.status(404).json({
        success: false,
        message: "Conversion recipe not found.",
      });
    }

    // Get or create default warehouse
    let wh;
    if (warehouseId) {
      wh = await Warehouse.findOne({ _id: warehouseId, businessId });
      if (!wh) {
        return res.status(404).json({
          success: false,
          message: "Warehouse not found.",
        });
      }
    } else {
      wh = await Warehouse.findOne({ businessId });
      if (!wh) {
        wh = new Warehouse({ businessId, name: "Default Warehouse" });
        await wh.save();
      }
    }

    // Check inventory for all input items
    for (const input of conversion.inputs) {
      const inv = await Inventory.findOne({
        businessId,
        warehouseId: wh._id,
        itemId: input.itemId._id
      });

      const availableQty = inv ? inv.quantity : 0;
      const requiredQty = input.quantity * quantity;

      if (availableQty < requiredQty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${input.itemId.name}. Required: ${requiredQty}, Available: ${availableQty}`,
        });
      }
    }

    // Perform the conversion in a transaction
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      // Deduct input quantities and collect transaction items
      const transactionItems = [];

      for (const input of conversion.inputs) {
        const requiredQty = input.quantity * quantity;

        // Update inventory
        const inv = await Inventory.findOneAndUpdate(
          { businessId, warehouseId: wh._id, itemId: input.itemId._id },
          { $inc: { quantity: -requiredQty } },
          { session, upsert: false }
        );

        // Add to transaction items
        transactionItems.push({
          itemId: input.itemId._id,
          quantity: requiredQty,
          direction: "OUT"
        });
      }

      // Add output quantity
      const outputInv = await Inventory.findOneAndUpdate(
        { businessId, warehouseId: wh._id, itemId: conversion.outputItemId._id },
        { $inc: { quantity: quantity } },
        { session, upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Add output to transaction items
      transactionItems.push({
        itemId: conversion.outputItemId._id,
        quantity: quantity,
        direction: "IN"
      });

      // Create transaction record
      const transaction = new Transaction({
        businessId,
        warehouseId: wh._id,
        type: "CONVERSION",
        items: transactionItems,
        referenceNote: `Converted ${quantity} ${conversion.outputItemId.unit} of ${conversion.outputItemId.name}`
      });

      await transaction.save({ session });

      await session.commitTransaction();

      res.status(200).json({
        success: true,
        message: "Conversion performed successfully!",
        data: {
          transaction,
          outputInventory: outputInv
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error("Perform Conversion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while performing conversion",
      error: error.message,
    });
  }
};