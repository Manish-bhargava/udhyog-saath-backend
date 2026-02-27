import { Item } from "../../../models/inventory/items.inventory.js";

export const getFinished = async (req, res) => {
  try {
    const { businessId } = req.params;

    const finishedItems = await Item.find({
      businessId,
      type: "FINISHED",
      isActive: true,
    }).select("-__v");

    res.status(200).json({
      success: true,
      data: finishedItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching finished items",
      error: error.message,
    });
  }
};