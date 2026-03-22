const express=require("express");
const inventoryRouter=express.Router();
const warehouseRouter=require("./warehouse.router.js");
const stockRouter=require("./stock.inventory.js");
const transactionsRouter=require("./transactions.router.js");
const conversionRouter=require("./conversion.router.js");

inventoryRouter.use("/warehouse",warehouseRouter);
inventoryRouter.use("/stock",stockRouter);
inventoryRouter.use("/transactions",transactionsRouter);
inventoryRouter.use("/conversion",conversionRouter);
module.exports=inventoryRouter;