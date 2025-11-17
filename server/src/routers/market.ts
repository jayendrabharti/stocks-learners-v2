import express from "express";
import {
  getMostBought,
  getTopMovers,
  getMarketTiming,
  getStatus,
  getFnOTopUnderlyings,
  getFnOMarketTrends,
  getFnOTopContracts,
  getIndices,
  getMajorIndices,
  getIndexDetails,
} from "@/controllers/market";

const router = express.Router();

// GET /market/most-bought
router.get("/most-bought", getMostBought);

// GET /market/top-movers - Unified endpoint for gainers, losers, and volume shakers
router.get("/top-movers", getTopMovers);

// GET /market/timing - Market timing information
router.get("/timing", getMarketTiming);

// GET /market/status - Current market status (open/closed)
router.get("/status", getStatus);

// F&O Routes
// GET /market/fno/top-underlyings - Top traded F&O underlyings
router.get("/fno/top-underlyings", getFnOTopUnderlyings);

// GET /market/fno/trends/:instrument - F&O market trends for specific instrument
router.get("/fno/trends/:instrument", getFnOMarketTrends);

// GET /market/fno/top-contracts - Top traded F&O contracts
router.get("/fno/top-contracts", getFnOTopContracts);

// Indices Routes
// GET /market/indices - Search indices by query
router.get("/indices", getIndices);

// GET /market/indices/major - Get major indices
router.get("/indices/major", getMajorIndices);

// GET /market/indices/:searchId - Get specific index details
router.get("/indices/:searchId", getIndexDetails);

export default router;
