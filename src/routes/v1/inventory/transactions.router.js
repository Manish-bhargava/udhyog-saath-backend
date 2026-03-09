const express = require("express");
const router = express.Router();
const verify = require("../../../utils/auth");
const isOnboarded = require("../../../utils/isOnboarded");

const { getTransactions } = require("../../../controllers/inventory/transaction/getTransactions.js");

router.get("/get", verify, isOnboarded, getTransactions);

module.exports = router;