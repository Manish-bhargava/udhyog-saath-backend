const express = require("express");
const stockRouter = express.Router();
const addFinished = require("../../../controllers/inventory/stock/addFinished.js");
const getFinished = require("../../../controllers/inventory/stock/getFinished.js");
const updateFinished = require("../../../controllers/inventory/stock/updateFinished.js");
const deleteFinished = require("../../../controllers/inventory/stock/deleteFinished.js");
const verify = require("../../../utils/auth");
const isOnboarded = require("../../../utils/isOnboarded");

stockRouter.post(
  "/finished/add",
  verify,
  uploads.single("productImg"),
  isOnboarded,
  addFinished,
);
stockRouter.get("/finished/get", verify, isOnboarded, getFinished);
stockRouter.put(
  "/finished/update/:id",
  verify,
  uploads.single("productImg"),
  isOnboarded,
  updateFinished,
);
stockRouter.delete("/finished/delete/:id", verify, isOnboarded, deleteFinished);

module.exports = stockRouter;
