const express=require("express");
const inventoryRouter=express.Router();
// const warehouseRouter=require("./warehouse.router.js");
const stockRouter=require("./stock.inventory.js");
// const conversionRouter=require("./conversion.router.js");

// inventoryRouter.use("/warehouse",warehouseRouter);
inventoryRouter.use("/stock",stockRouter);
// inventoryRouter.use("/conversion",conversionRouter);
module.exports=inventoryRouter;