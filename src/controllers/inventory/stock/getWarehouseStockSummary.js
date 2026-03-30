const Item = require("../../../models/inventory/items.inventory.js");
const Inventory = require("../../../models/inventory/inventory.inventory.js");
const Warehouse = require("../../../models/inventory/warehouse.inventory.js");

const UNASSIGNED_KEY = "__unassigned__";

/**
 * Per-warehouse stock from Inventory rows (source of truth), joined with Items.
 */
exports.getWarehouseStockSummary = async (req, res) => {
  try {
    const businessId = req.user._id;

    const warehouses = await Warehouse.find({ businessId, isActive: true })
      .select("name location")
      .lean();
    const whById = new Map(warehouses.map((w) => [String(w._id), w]));

    const invRows = await Inventory.find({ businessId }).lean();
    const itemIds = [...new Set(invRows.map((r) => String(r.itemId)))];
    const items = await Item.find({
      _id: { $in: itemIds },
      businessId,
      isActive: true,
    })
      .select("name unit type")
      .lean();
    const itemById = new Map(items.map((i) => [String(i._id), i]));

    const sectionMap = new Map();

    const ensureSection = (key, meta) => {
      if (!sectionMap.has(key)) {
        sectionMap.set(key, { key, lines: [], ...meta });
      }
      return sectionMap.get(key);
    };

    for (const w of warehouses) {
      ensureSection(String(w._id), {
        warehouseId: w._id,
        name: w.name || "Warehouse",
        location: w.location || "",
      });
    }

    for (const row of invRows) {
      const item = itemById.get(String(row.itemId));
      if (!item) continue;

      const wid = row.warehouseId;
      let sectionKey;
      let sectionMeta;

      if (!wid) {
        sectionKey = UNASSIGNED_KEY;
        sectionMeta = {
          warehouseId: null,
          name: "Unassigned (no warehouse)",
          location: "",
        };
      } else if (whById.has(String(wid))) {
        sectionKey = String(wid);
        const w = whById.get(String(wid));
        sectionMeta = {
          warehouseId: wid,
          name: w.name || "Warehouse",
          location: w.location || "",
        };
      } else {
        sectionKey = `__orphan__${String(wid)}`;
        sectionMeta = {
          warehouseId: wid,
          name: "Other / unknown warehouse",
          location: "",
        };
      }

      const sec = ensureSection(sectionKey, sectionMeta);
      const reserved = row.reservedQuantity || 0;
      const available = Math.max(0, row.quantity - reserved);
      sec.lines.push({
        itemId: row.itemId,
        kind: item.type === "RAW" ? "Raw" : "Finished",
        name: item.name,
        unit: item.unit || "—",
        quantity: row.quantity,
        reservedQuantity: reserved,
        availableQuantity: available,
      });
    }

    for (const sec of sectionMap.values()) {
      sec.lines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    const sections = [];
    const added = new Set();
    for (const w of warehouses) {
      const k = String(w._id);
      sections.push(sectionMap.get(k) || ensureSection(k, {
        warehouseId: w._id,
        name: w.name || "Warehouse",
        location: w.location || "",
      }));
      added.add(k);
    }

    for (const [k, sec] of sectionMap) {
      if (!added.has(k)) {
        sections.push(sec);
        added.add(k);
      }
    }

    sections.sort((a, b) => {
      if (a.key === UNASSIGNED_KEY) return 1;
      if (b.key === UNASSIGNED_KEY) return -1;
      if (String(a.key).startsWith("__orphan__")) return 1;
      if (String(b.key).startsWith("__orphan__")) return -1;
      return (a.name || "").localeCompare(b.name || "");
    });

    res.status(200).json({ success: true, data: { sections } });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error building warehouse stock summary",
      error: error.message,
    });
  }
};
