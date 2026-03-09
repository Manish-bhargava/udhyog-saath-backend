const express = require("express");
const warehouseRouter = express.Router();
const verify = require("../../../utils/auth");
const isOnboarded = require("../../../utils/isOnboarded");

const { addWarehouse } = require("../../../controllers/inventory/warehouse/addWarehouse.js");
const { getWarehouses } = require("../../../controllers/inventory/warehouse/getWarehouses.js");
const { updateWarehouse } = require("../../../controllers/inventory/warehouse/updateWarehouse.js");
const { deleteWarehouse } = require("../../../controllers/inventory/warehouse/deleteWarehouse.js");

warehouseRouter.post("/add", verify, isOnboarded, addWarehouse);
warehouseRouter.get("/get", verify, isOnboarded, getWarehouses);
warehouseRouter.put("/update/:id", verify, isOnboarded, updateWarehouse);
warehouseRouter.delete("/delete/:id", verify, isOnboarded, deleteWarehouse);

module.exports = warehouseRouter;