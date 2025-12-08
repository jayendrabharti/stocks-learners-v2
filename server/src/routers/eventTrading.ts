/**
 * Event Trading Router
 * Trading operations within events
 */

import express from "express";
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

// Trading operations
EventTradingRouter.post("/:eventId/trading/buy", buyOrder);
EventTradingRouter.post("/:eventId/trading/sell", sellOrder);
EventTradingRouter.get("/:eventId/trading/positions", getPositions);
EventTradingRouter.get("/:eventId/trading/transactions", getTransactions);
EventTradingRouter.get("/:eventId/portfolio", getEventPortfolio);

export default EventTradingRouter;
