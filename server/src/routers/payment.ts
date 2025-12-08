import validToken from "@/middlewares/validToken";
import { CreateOrder, VerifyOrder, verifyEventPayment, getPaymentHistory } from "@/controllers/payment";
import express from "express";

const PaymentRouter = express.Router();

PaymentRouter.use(validToken);

// Existing payment routes
PaymentRouter.get("/create-order", CreateOrder);
PaymentRouter.get("/verify-order", VerifyOrder);

// Event payment routes
PaymentRouter.post("/event/verify", verifyEventPayment);
PaymentRouter.get("/history", getPaymentHistory);

export default PaymentRouter;
