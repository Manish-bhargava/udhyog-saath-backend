const Conversion = require("../../../models/inventory/conversion.inventory");

exports.getConversions = async (req, res) => {
  try {
    const businessId = req.user._id;

    const conversions = await Conversion.find({ businessId })
      .populate('outputItemId', 'name unit type')
      .populate('inputs.itemId', 'name unit type')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: conversions,
    });
  } catch (error) {
    console.error("Get Conversions Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversion recipes",
      error: error.message,
    });
  }
};