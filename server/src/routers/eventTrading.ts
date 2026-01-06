/**
 * Event Trading Router
 * Trading operations within events
 */

import express from "express";
import rateLimit from "express-rate-limit";
import validToken from "@/middlewares/validToken.js";
import {
  buyOrder,
  sellOrder,
  getPositions,
  getTransactions,
  getEventPortfolio,
} from "@/controllers/eventTrading.js";

const EventTradingRouter = express.Router();

// All routes require authentication
EventTradingRouter.use(validToken);

// Rate limiting for event trading endpoints (prevent abuse)
const eventTradingLimiter = rateLimit({
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

// Trading operations (with rate limiting)
EventTradingRouter.post("/:eventId/trading/buy", eventTradingLimiter, buyOrder);
EventTradingRouter.post(
  "/:eventId/trading/sell",
  eventTradingLimiter,
  sellOrder
);

// Read operations (no rate limiting needed)
EventTradingRouter.get("/:eventId/trading/positions", getPositions);
EventTradingRouter.get("/:eventId/trading/transactions", getTransactions);
EventTradingRouter.get("/:eventId/portfolio", getEventPortfolio);

export default EventTradingRouter;
