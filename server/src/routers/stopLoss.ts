/**
 * Stop Loss Router
 * Routes for managing stop loss orders
 */

import express from "express";
import {
  createStopLoss,
  getStopLossOrders,
  cancelStopLoss,
} from "@/controllers/stopLoss";
import validToken from "@/middlewares/validToken";
import rateLimit from "express-rate-limit";

const StopLossRouter = express.Router();

// All routes require authentication
StopLossRouter.use(validToken);

// Rate limiting
const stopLossLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Too many stop loss requests. Please wait a moment and try again.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /stop-loss
 * Create a new stop loss order
 * Body: { positionId, triggerPrice, qty? }
 */
StopLossRouter.post("/", stopLossLimiter, createStopLoss);

/**
 * GET /stop-loss
 * Get all stop loss orders
 * Query: status? (ACTIVE, TRIGGERED, EXECUTED, FAILED, CANCELLED)
 */
StopLossRouter.get("/", getStopLossOrders);

/**
 * DELETE /stop-loss/:id
 * Cancel a stop loss order
 */
StopLossRouter.delete("/:id", stopLossLimiter, cancelStopLoss);

export default StopLossRouter;
