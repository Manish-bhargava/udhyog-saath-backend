const Item = require("../../../models/inventory/items.inventory.js");
const Inventory = require("../../../models/inventory/inventory.inventory.js");
const Warehouse = require("../../../models/inventory/warehouse.inventory.js");

function aggregateInventoryForItems(invRows, itemIdStr, requestedWarehouseId) {
  const rows = invRows.filter((r) => String(r.itemId) === itemIdStr);

  if (requestedWarehouseId) {
    const row = rows.find(
      (r) => String(r.warehouseId) === String(requestedWarehouseId),
    );
    const quantity = row?.quantity ?? 0;
    const reservedQuantity = row?.reservedQuantity ?? 0;
    const availableQuantity = Math.max(0, quantity - reservedQuantity);
    return {
      quantity,
      reservedQuantity,
      availableQuantity,
      warehouseId: requestedWarehouseId,
    };
  }

  let totalQty = 0;
  let totalReserved = 0;
  let totalAvailable = 0;
  let bestWh = null;
  let bestAvail = -1;

  for (const r of rows) {
    const res = r.reservedQuantity || 0;
    const avail = Math.max(0, r.quantity - res);
    totalQty += r.quantity;
    totalReserved += res;
    totalAvailable += avail;
    if (avail > bestAvail) {
      bestAvail = avail;
      bestWh = r.warehouseId;
    }
  }

  if (bestWh == null && rows.length > 0) {
    bestWh = rows[0].warehouseId;
  }

  return {
    quantity: totalQty,
    reservedQuantity: totalReserved,
    availableQuantity: totalAvailable,
    warehouseId: bestWh,
  };
}

exports.getRaw = async (req, res) => {
  try {
    const businessId = req.user._id;
    const requestedWarehouseId = req.query.warehouseId || null;

    const rawItems = await Item.find({
      businessId,
      type: "RAW",
      isActive: true,
    }).select("-__v");

    const itemIds = rawItems.map((i) => i._id);
    const invRows = await Inventory.find({
      businessId,
      itemId: { $in: itemIds },
    })
      .select("warehouseId itemId quantity reservedQuantity")
      .lean();

    const enriched = rawItems.map((item) => {
      const id = String(item._id);
      const agg = aggregateInventoryForItems(invRows, id, requestedWarehouseId);
      const obj = item.toObject();
      const catalogWh = obj.warehouseId || null;
      const displayWh = requestedWarehouseId
        ? agg.warehouseId
        : catalogWh || agg.warehouseId;
      return {
        ...obj,
        quantity: agg.quantity,
        reservedQuantity: agg.reservedQuantity,
        availableQuantity: agg.availableQuantity,
        warehouseId: displayWh,
      };
    });

    const whIds = [
      ...new Set(
        [
          ...enriched.map((e) => e.warehouseId),
          ...rawItems.map((i) => i.warehouseId),
        ].filter(Boolean),
      ),
    ];
    const warehouses =
      whIds.length > 0
        ? await Warehouse.find({
            _id: { $in: whIds },
            businessId,
          })
            .select("name")
            .lean()
        : [];
    const whNameById = new Map(
      warehouses.map((w) => [String(w._id), w.name || ""]),
    );

    const withNames = enriched.map((row) => ({
      ...row,
      warehouseName: row.warehouseId
        ? whNameById.get(String(row.warehouseId)) || ""
        : "",
    }));

    res.status(200).json({
      success: true,
      data: withNames,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching raw materials",
      error: error.message,
    });
  }
};
