import validToken from "@/middlewares/validToken";
import {
  CreateOrder,
  VerifyOrder,
  verifyEventPayment,
  getPaymentHistory,
} from "@/controllers/payment";
import express from "express";
import rateLimit from "express-rate-limit";

const PaymentRouter = express.Router();

// Rate limiters for payment endpoints
const createOrderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many order creation requests. Please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyOrderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many verification requests. Please try again later.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

PaymentRouter.use(validToken);

// Payment routes with rate limiting
// Support both GET (legacy) and POST for create-order
PaymentRouter.get("/create-order", createOrderLimiter, CreateOrder);
PaymentRouter.post("/create-order", createOrderLimiter, CreateOrder);

// Support both GET (legacy) and POST for verify-order
PaymentRouter.get("/verify-order", verifyOrderLimiter, VerifyOrder);
PaymentRouter.post("/verify-order", verifyOrderLimiter, VerifyOrder);

// Event payment routes
PaymentRouter.post("/event/verify", verifyOrderLimiter, verifyEventPayment);

// Payment history
PaymentRouter.get("/history", getPaymentHistory);

export default PaymentRouter;
