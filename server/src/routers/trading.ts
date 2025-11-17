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

const TradingRouter = express.Router();

// All trading routes require authentication
TradingRouter.use(validToken);

/**
 * POST /trading/buy
 * Execute a BUY order
 * Body: { instrumentId, qty, product, limitPrice? }
 */
TradingRouter.post("/buy", buyOrder);

/**
 * POST /trading/sell
 * Execute a SELL order
 * Body: { instrumentId, qty, product, limitPrice? }
 */
TradingRouter.post("/sell", sellOrder);

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
