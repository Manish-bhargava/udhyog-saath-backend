const express = require("express");
const v1Router = express.Router();
const authRouter = require("../v1/auth/user.auth");
const onBoardingRouter = require("../v1/onBoarding/onboarding");
const BillRouter = require("../v1/bills/BillsRouter");
const aiRouter = require("../v1/ai/aiChatRouter");
const paymentRouter = require("../v1/payment/payment");
const inventoryRouter = require("../v1/inventory/inventoryRouter");
v1Router.use("/auth", authRouter);
v1Router.use("/user", onBoardingRouter);
v1Router.use("/bill", BillRouter);
v1Router.use("/ai", aiRouter);
v1Router.use("/payment", paymentRouter);
v1Router.use("/inventory", inventoryRouter);

module.exports = v1Router;
