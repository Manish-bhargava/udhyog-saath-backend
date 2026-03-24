const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function backfillItemWarehouseIds() {
  const Item = require("../models/inventory/items.inventory");
  const Warehouse = require("../models/inventory/warehouse.inventory");
  const businessIds = await Item.distinct("businessId", {
    $or: [{ warehouseId: { $exists: false } }, { warehouseId: null }],
  });
  for (const bizId of businessIds) {
    if (!bizId) continue;
    const wh = await Warehouse.findOne({ businessId: bizId, isActive: true }).sort({
      createdAt: 1,
    });
    if (!wh) continue;
    await Item.updateMany(
      {
        businessId: bizId,
        $or: [{ warehouseId: { $exists: false } }, { warehouseId: null }],
      },
      { $set: { warehouseId: wh._id } },
    );
  }
}

module.exports = async function connectToDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("data base connected suucessfully");

  try {
    const Item = require("../models/inventory/items.inventory");
    await backfillItemWarehouseIds();
    await Item.syncIndexes();
  } catch (e) {
    console.warn("Item index / backfill warning:", e.message);
  }
};