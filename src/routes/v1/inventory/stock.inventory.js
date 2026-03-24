const express = require("express");
const stockRouter = express.Router();
const {addFinished} = require("../../../controllers/inventory/stock/addFinished.js");
const {getFinished} = require("../../../controllers/inventory/stock/getFinished.js");
const { getWarehouseStockSummary } = require("../../../controllers/inventory/stock/getWarehouseStockSummary.js");
const {updateFinished} = require("../../../controllers/inventory/stock/updateFinished.js");
const {deleteFinished} = require("../../../controllers/inventory/stock/deleteFinished.js");

// raw material controllers
const {addRaw} = require("../../../controllers/inventory/stock/addRaw.js");
const {getRaw} = require("../../../controllers/inventory/stock/getRaw.js");
const {updateRaw} = require("../../../controllers/inventory/stock/updateRaw.js");
const {deleteRaw} = require("../../../controllers/inventory/stock/deleteRaw.js");
const verify = require("../../../utils/auth");
const isOnboarded = require("../../../utils/isOnboarded");
const {uploads} = require("../../../utils/multer.js");

stockRouter.post(
  "/finished/add",
  verify,
  uploads.single("productImg"),
  isOnboarded,
  addFinished,
);
stockRouter.get("/finished/get", verify, isOnboarded, getFinished);
stockRouter.get(
  "/warehouse-summary",
  verify,
  isOnboarded,
  getWarehouseStockSummary,
);
stockRouter.put(
  "/finished/update/:id",
  verify,
  uploads.single("productImg"),
  isOnboarded,
  updateFinished,
);
stockRouter.delete("/finished/delete/:id", verify, isOnboarded, deleteFinished);

// raw material routes
stockRouter.post(
  "/raw/add",
  verify,
  uploads.single("productImg"),
  isOnboarded,
  addRaw,
);
stockRouter.get("/raw/get", verify, isOnboarded, getRaw);
stockRouter.put(
  "/raw/update/:id",
  verify,
  uploads.single("productImg"),
  isOnboarded,
  updateRaw,
);
stockRouter.delete("/raw/delete/:id", verify, isOnboarded, deleteRaw);

module.exports = stockRouter;
