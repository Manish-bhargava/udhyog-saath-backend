const express = require("express");
const stockRouter = express.Router();
const addFinished = require("../../../controllers/inventory/stock/addFinished.js");
const getFinished = require("../../../controllers/inventory/stock/getFinished.js");
const updateFinished = require("../../../controllers/inventory/stock/updateFinished.js");
const deleteFinished = require("../../../controllers/inventory/stock/deleteFinished.js");
const verify = require("../../../utils/auth");
const isOnboarded = require("../../../utils/isOnboarded");

stockRouter.post("/raw/add", verify, isOnboarded, addFinished);
stockRouter.get("/raw/get", verify, isOnboarded, getFinished);
stockRouter.put("/raw/update/:id", verify, isOnboarded, updateFinished);
stockRouter.delete("/raw/delete/:id", verify, isOnboarded, deleteFinished);

module.exports = stockRouter;