import express from "express";
import { getMostBought, getTopMovers } from "@/controllers/market";

const router = express.Router();

// GET /market/most-bought
router.get("/most-bought", getMostBought);

// GET /market/top-movers - Unified endpoint for gainers, losers, and volume shakers
router.get("/top-movers", getTopMovers);

export default router;
