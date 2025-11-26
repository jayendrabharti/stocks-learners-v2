import validToken from "@/middlewares/validToken";
import { CreateOrder, VerifyOrder } from "@/controllers/payment";
import express from "express";

const PaymentRouter = express.Router();

PaymentRouter.use(validToken);

PaymentRouter.get("/create-order", CreateOrder);

PaymentRouter.get("/verify-order", VerifyOrder);

export default PaymentRouter;
