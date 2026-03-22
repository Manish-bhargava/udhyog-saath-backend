const Conversion = require("../../../models/inventory/conversion.inventory");
const Item = require("../../../models/inventory/items.inventory");

exports.updateConversion = async (req, res) => {
  try {
    const businessId = req.user._id;
    const { id } = req.params;
    const { outputItemId, inputs } = req.body;

    // Find existing conversion
    const conversion = await Conversion.findOne({
      _id: id,
      businessId
    });
    if (!conversion) {
      return res.status(404).json({
        success: false,
        message: "Conversion recipe not found.",
      });
    }

    // If outputItemId is being changed, validate it
    if (outputItemId && outputItemId !== conversion.outputItemId.toString()) {
      const outputItem = await Item.findOne({
        _id: outputItemId,
        businessId,
        type: "FINISHED"
      });
      if (!outputItem) {
        return res.status(404).json({
          success: false,
          message: "Output item not found or is not a finished product.",
        });
      }

      // Check if another conversion exists for this output item
      const existingConversion = await Conversion.findOne({
        businessId,
        outputItemId,
        _id: { $ne: id }
      });
      if (existingConversion) {
        return res.status(409).json({
          success: false,
          message: "A conversion recipe already exists for this finished product.",
        });
      }

      conversion.outputItemId = outputItemId;
    }

    // If inputs are being updated, validate them
    if (inputs) {
      if (!Array.isArray(inputs) || inputs.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Inputs must be a non-empty array.",
        });
      }

      for (const input of inputs) {
        if (!input.itemId || !input.quantity || input.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: "Each input must have a valid itemId and positive quantity.",
          });
        }

        const inputItem = await Item.findOne({
          _id: input.itemId,
          businessId,
          type: "RAW"
        });
        if (!inputItem) {
          return res.status(404).json({
            success: false,
            message: `Input item ${input.itemId} not found or is not a raw material.`,
          });
        }
      }

      conversion.inputs = inputs.map(input => ({
        itemId: input.itemId,
        quantity: Number(input.quantity)
      }));
    }

    await conversion.save();

    res.status(200).json({
      success: true,
      message: "Conversion recipe updated successfully!",
      data: conversion,
    });
  } catch (error) {
    console.error("Update Conversion Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A conversion recipe already exists for this finished product.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while updating conversion recipe",
      error: error.message,
    });
  }
};