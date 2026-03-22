const Conversion = require("../../../models/inventory/conversion.inventory");

exports.deleteConversion = async (req, res) => {
  try {
    const businessId = req.user._id;
    const { id } = req.params;

    const conversion = await Conversion.findOneAndDelete({
      _id: id,
      businessId
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        message: "Conversion recipe not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversion recipe deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Conversion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting conversion recipe",
      error: error.message,
    });
  }
};