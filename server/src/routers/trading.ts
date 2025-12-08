/**
 * Trading Router
 * Defines routes for trading operations: BUY, SELL, positions
 */

import express from "express";
import {
  buyOrder,
  sellOrder,
  getPositions,
  getPositionById,
  getTransactions,
} from "@/controllers/trading";
import validToken from "@/middlewares/validToken";
import rateLimit from "express-rate-limit";

const TradingRouter = express.Router();

// All trading routes require authentication
TradingRouter.use(validToken);

// Rate limiting for trading endpoints (prevent abuse)
const tradingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per user
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many trading requests. Please wait a moment and try again.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /trading/buy
 * Execute a BUY order
 * Body: { instrumentId, qty, product, limitPrice? }
 */
TradingRouter.post("/buy", tradingLimiter, buyOrder);

/**
 * POST /trading/sell
 * Execute a SELL order
 * Body: { instrumentId, qty, product, limitPrice? }
 */
TradingRouter.post("/sell", tradingLimiter, sellOrder);

/**
 * GET /trading/positions
 * Get user's positions
 * Query params: product? (CNC/MIS), instrumentId?
 */
TradingRouter.get("/positions", getPositions);

/**
 * GET /trading/positions/:positionId
 * Get specific position details
 */
TradingRouter.get("/positions/:positionId", getPositionById);

/**
 * GET /trading/transactions
 * Get user's transaction history
 * Query params: limit?, offset?, side? (BUY/SELL), product? (CNC/MIS)
 */
TradingRouter.get("/transactions", getTransactions);

export default TradingRouter;
