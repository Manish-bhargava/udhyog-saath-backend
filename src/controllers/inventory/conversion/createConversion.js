const Conversion = require("../../../models/inventory/conversion.inventory");
const Item = require("../../../models/inventory/items.inventory");

exports.createConversion = async (req, res) => {
  try {
    const businessId = req.user._id;
    const { outputItemId, inputs } = req.body;

    // Validation
    if (!outputItemId || !inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Output item and inputs are required.",
      });
    }

    // Check if output item exists and is a finished product
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

    // Validate inputs
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

    // Check if conversion already exists for this output item
    const existingConversion = await Conversion.findOne({
      businessId,
      outputItemId
    });
    if (existingConversion) {
      return res.status(409).json({
        success: false,
        message: "A conversion recipe already exists for this finished product.",
      });
    }

    const newConversion = new Conversion({
      businessId,
      outputItemId,
      inputs: inputs.map(input => ({
        itemId: input.itemId,
        quantity: Number(input.quantity)
      }))
    });

    await newConversion.save();

    res.status(201).json({
      success: true,
      message: "Conversion recipe created successfully!",
      data: newConversion,
    });
  } catch (error) {
    console.error("Create Conversion Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A conversion recipe already exists for this finished product.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating conversion recipe",
      error: error.message,
    });
  }
};