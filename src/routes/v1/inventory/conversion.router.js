const express = require("express");
const conversionRouter = express.Router();

const { createConversion } = require("../../../controllers/inventory/conversion/createConversion");
const { getConversions } = require("../../../controllers/inventory/conversion/getConversions");
const { updateConversion } = require("../../../controllers/inventory/conversion/updateConversion");
const { deleteConversion } = require("../../../controllers/inventory/conversion/deleteConversion");
const { performConversion } = require("../../../controllers/inventory/conversion/performConversion");

const verify = require("../../../utils/auth");
const isOnboarded = require("../../../utils/isOnboarded");

conversionRouter.post("/create", verify, isOnboarded, createConversion);
conversionRouter.get("/get", verify, isOnboarded, getConversions);
conversionRouter.put("/update/:id", verify, isOnboarded, updateConversion);
conversionRouter.delete("/delete/:id", verify, isOnboarded, deleteConversion);
conversionRouter.post("/perform", verify, isOnboarded, performConversion);

module.exports = conversionRouter;