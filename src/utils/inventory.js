const Inventory = require("../models/inventory/inventory.inventory");
const Transaction = require("../models/inventory/transaction.inventory");
const Warehouse = require("../models/inventory/warehouse.inventory");

// Ensure there is at least one warehouse for the business. If none exists, create a default one.

//TODO: what if there are multiple warehouses and the prod is in some other warehouse.
async function getOrCreateDefaultWarehouse(businessId) {
  let wh = await Warehouse.findOne({ businessId });
  if (!wh) {
    wh = new Warehouse({ businessId, name: "Default Warehouse" });
    await wh.save();
  }
  return wh;
}

/**
 * Adjusts inventory quantity and records a transaction.
 *
 * @param {Object} params
 * @param {ObjectId} params.businessId
 * @param {ObjectId} [params.warehouseId] - if omitted uses default warehouse
 * @param {ObjectId} params.itemId
 * @param {Number} params.qtyChange - positive for IN, negative for OUT
 * @param {String} params.transactionType - one of PURCHASE/SALE/CONVERSION/ADJUSTMENT/TRANSFER
 * @param {String} [params.referenceNote]
 */
async function adjustInventory({
  businessId,
  warehouseId,
  itemId,
  qtyChange,
  transactionType,
  referenceNote,
}) {
  if (!businessId || !itemId || !transactionType || typeof qtyChange !== "number") {
    throw new Error("Missing parameters for adjustInventory");
  }

  if (!warehouseId) {
    const wh = await getOrCreateDefaultWarehouse(businessId);
    warehouseId = wh._id;
  }

  // fetch or create inventory record
  let inv = await Inventory.findOne({ businessId, warehouseId, itemId });
  if (!inv) {
    inv = new Inventory({ businessId, warehouseId, itemId, quantity: 0, reservedQuantity: 0 });
  }

  const newQty = inv.quantity + qtyChange;
  if (newQty < 0) {
    throw new Error("Insufficient stock for item");
  }
  // also ensure we never go below reserved
  if (newQty < (inv.reservedQuantity || 0)) {
    throw new Error("Insufficient available stock (reserved exceeds remaining)");
  }
  inv.quantity = newQty;
  await inv.save();

  const direction = qtyChange >= 0 ? "IN" : "OUT";
  const trans = new Transaction({
    businessId,
    warehouseId,
    type: transactionType,
    items: [{ itemId, quantity: Math.abs(qtyChange), direction }],
    referenceNote,
  });
  await trans.save();

  return { inventory: inv, transaction: trans };
}

/**
 * Reserve stock for a Kaccha bill. This does NOT change total quantity,
 * it increases reservedQuantity, reducing availability.
 */
async function reserveInventory({ businessId, warehouseId, itemId, qty, referenceNote }) {
  if (!businessId || !itemId || typeof qty !== "number") {
    throw new Error("Missing parameters for reserveInventory");
  }
  if (qty <= 0) return null;

  if (!warehouseId) {
    const wh = await getOrCreateDefaultWarehouse(businessId);
    warehouseId = wh._id;
  }

  let inv = await Inventory.findOne({ businessId, warehouseId, itemId });
  if (!inv) {
    inv = new Inventory({ businessId, warehouseId, itemId, quantity: 0, reservedQuantity: 0 });
  }

  const available = inv.quantity - (inv.reservedQuantity || 0);
  if (available < qty) {
    throw new Error("Insufficient available stock to reserve");
  }

  inv.reservedQuantity = (inv.reservedQuantity || 0) + qty;
  await inv.save();

  const trans = new Transaction({
    businessId,
    warehouseId,
    type: "ADJUSTMENT",
    items: [{ itemId, quantity: qty, direction: "OUT" }],
    referenceNote: referenceNote ? `RESERVE: ${referenceNote}` : "RESERVE",
  });
  await trans.save();

  return { inventory: inv, transaction: trans };
}

/**
 * Release previously reserved stock (e.g. delete kaccha, reduce qty, or convert).
 */
async function releaseReserved({ businessId, warehouseId, itemId, qty, referenceNote }) {
  if (!businessId || !itemId || typeof qty !== "number") {
    throw new Error("Missing parameters for releaseReserved");
  }
  if (qty <= 0) return null;

  if (!warehouseId) {
    const wh = await getOrCreateDefaultWarehouse(businessId);
    warehouseId = wh._id;
  }

  let inv = await Inventory.findOne({ businessId, warehouseId, itemId });
  if (!inv) {
    // nothing reserved, nothing to release
    return null;
  }

  const currentReserved = inv.reservedQuantity || 0;
  if (currentReserved < qty) {
    throw new Error("Cannot release more than reserved");
  }

  inv.reservedQuantity = currentReserved - qty;
  await inv.save();

  const trans = new Transaction({
    businessId,
    warehouseId,
    type: "ADJUSTMENT",
    items: [{ itemId, quantity: qty, direction: "IN" }],
    referenceNote: referenceNote ? `RELEASE: ${referenceNote}` : "RELEASE",
  });
  await trans.save();

  return { inventory: inv, transaction: trans };
}

module.exports = { getOrCreateDefaultWarehouse, adjustInventory, reserveInventory, releaseReserved };
