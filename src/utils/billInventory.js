const Item = require("../models/inventory/items.inventory");
const Warehouse = require("../models/inventory/warehouse.inventory");
const { getOrCreateDefaultWarehouse } = require("./inventory");

/**
 * Resolve a FINISHED catalog item from a bill line (prefers inventoryItemId).
 */
async function resolveFinishedItem(userId, prod) {
  if (!prod) return null;
  if (prod.inventoryItemId) {
    const item = await Item.findOne({
      _id: prod.inventoryItemId,
      businessId: userId,
      type: "FINISHED",
      isActive: true,
    });
    if (item) return item;
  }
  const name = typeof prod.name === "string" ? prod.name.trim() : "";
  if (!name) return null;

  const base = {
    businessId: userId,
    name,
    type: "FINISHED",
    isActive: true,
  };
  if (prod.warehouseId) {
    const withWh = await Item.findOne({ ...base, warehouseId: prod.warehouseId });
    if (withWh) return withWh;
  }
  return Item.findOne(base).sort({ createdAt: 1 });
}

/**
 * Resolve warehouse for a bill line: line warehouse → bill-level → default.
 */
async function resolveLineWarehouseId(userId, prod, billWarehouseId) {
  const tryIds = [prod?.warehouseId, billWarehouseId].filter(Boolean);
  for (const wid of tryIds) {
    const wh = await Warehouse.findOne({ _id: wid, businessId: userId, isActive: true });
    if (wh) return wh._id;
  }
  const { _id } = await getOrCreateDefaultWarehouse(userId);
  return _id;
}

/**
 * Build stable key for aggregating quantities: itemId + warehouseId.
 */
function lineAggregateKey(itemId, warehouseId) {
  return `${String(itemId)}@${String(warehouseId)}`;
}

module.exports = {
  resolveFinishedItem,
  resolveLineWarehouseId,
  lineAggregateKey,
};
