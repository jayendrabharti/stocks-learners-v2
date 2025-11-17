import { Request, Response } from "express";
import {
  fetchMostBoughtStocks,
  fetchTopMovers,
  MoverType,
  fetchMarketTiming,
  getMarketStatus,
  fetchFnOTopUnderlyings,
  fetchFnOMarketTrends,
  fetchFnOTopContracts,
  fetchIndices,
  fetchMajorIndices,
  fetchIndexDetails,
} from "@/services";

/**
 * Get most bought stocks on Groww
 */
export const getMostBought = async (req: Request, res: Response) => {
  try {
    const size = parseInt(req.query.size as string) || 10;

    const data = await fetchMostBoughtStocks({ size });

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch most bought stocks",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get top market movers (gainers, losers, or volume shakers)
 */
export const getTopMovers = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "gainers";
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const data = await fetchTopMovers({
      type: type as MoverType,
      pageSize,
    });

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching top movers:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch market data",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get market timing information
 */
export const getMarketTiming = async (_req: Request, res: Response) => {
  try {
    const data = await fetchMarketTiming();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching market timing:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market timing",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get current market status (open/closed)
 */
export const getStatus = async (_req: Request, res: Response) => {
  try {
    const data = await getMarketStatus();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching market status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market status",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get top traded F&O underlyings
 */
export const getFnOTopUnderlyings = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 6;
    const data = await fetchFnOTopUnderlyings(limit);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching F&O underlyings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch F&O underlyings",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get F&O market trends for a specific instrument
 */
export const getFnOMarketTrends = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { instrument } = req.params;
    if (!instrument) {
      res.status(400).json({
        success: false,
        error: "Instrument parameter is required",
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const { exchange, interval, limit, marketTrendFactor, type } = req.query;

    const options: {
      exchange?: string;
      interval?: string;
      limit?: number;
      marketTrendFactor?: string;
      type?: string;
    } = {};
    if (exchange) options.exchange = exchange as string;
    if (interval) options.interval = interval as string;
    if (limit) options.limit = parseInt(limit as string);
    if (marketTrendFactor)
      options.marketTrendFactor = marketTrendFactor as string;
    if (type) options.type = type as string;

    const data = await fetchFnOMarketTrends(instrument, options);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching F&O market trends:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch F&O market trends",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get top traded F&O contracts
 */
export const getFnOTopContracts = async (req: Request, res: Response) => {
  try {
    const { exchange, instruments, limit } = req.query;

    const options: {
      exchange?: string;
      instruments?: string;
      limit?: number;
    } = {};
    if (exchange) options.exchange = exchange as string;
    if (instruments) options.instruments = instruments as string;
    if (limit) options.limit = parseInt(limit as string);

    const data = await fetchFnOTopContracts(options);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching F&O contracts:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch F&O contracts",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get indices by search term
 */
export const getIndices = async (req: Request, res: Response) => {
  try {
    const searchTerm = (req.query.q as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;

    const data = await fetchIndices(searchTerm, page, size);

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching indices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch indices",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get major indices (predefined list)
 */
export const getMajorIndices = async (_req: Request, res: Response) => {
  try {
    const data = await fetchMajorIndices();

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching major indices:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch major indices",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get specific index details
 */
export const getIndexDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { searchId } = req.params;
    if (!searchId) {
      res.status(400).json({
        success: false,
        error: "Search ID parameter is required",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const data = await fetchIndexDetails(searchId);

    if (!data) {
      res.status(404).json({
        success: false,
        error: "Index not found",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching index details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch index details",
      timestamp: new Date().toISOString(),
    });
  }
};
