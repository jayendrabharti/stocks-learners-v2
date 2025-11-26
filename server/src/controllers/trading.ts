/**
 * Trading Controller
 * Handles BUY, SELL, and position management endpoints
 */

import { Request, Response } from "express";
import prisma from "@/database/client";
import { executeBuy, executeSell } from "@/utils/trading";
import { getLivePrice } from "@/utils/trading/livePrice";
import { calculateTotalUnrealizedPnL } from "@/utils/trading/calculatePnL";
import type { TradeType } from "@/database/generated/enums";

/**
 * Execute a BUY order
 * POST /trading/buy
 * Body: { instrumentId, qty, product, limitPrice? }
 */
export const buyOrder = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    const { exchangeToken, qty, product, limitPrice } = req.body;

    // Validate required fields
    if (!exchangeToken || !qty || !product) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: exchangeToken, qty, product",
      });
    }

    // Validate product type
    if (product !== "CNC" && product !== "MIS") {
      return res.status(400).json({
        success: false,
        message: "Invalid product type. Must be 'CNC' or 'MIS'",
      });
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: "Instrument not found",
      });
    }

    // Execute buy order
    const buyInput: any = {
      userId,
      instrumentId: instrument.id,
      qty: parseInt(qty),
      product: product as TradeType,
    };

    if (limitPrice) {
      buyInput.limitPrice = parseFloat(limitPrice);
    }

    const result = await executeBuy(buyInput);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Buy order error:", error);

    // Categorize error types for better user feedback
    const errorMessage =
      error instanceof Error ? error.message : "Failed to execute buy order";

    if (
      errorMessage.includes("Insufficient funds") ||
      errorMessage.includes("Insufficient margin")
    ) {
      return res.status(400).json({
        success: false,
        errorCode: "INSUFFICIENT_FUNDS",
        message: errorMessage,
      });
    }

    if (
      errorMessage.includes("validation failed") ||
      errorMessage.includes("not allowed")
    ) {
      return res.status(400).json({
        success: false,
        errorCode: "VALIDATION_ERROR",
        message: errorMessage,
      });
    }

    if (errorMessage.includes("not found")) {
      return res.status(404).json({
        success: false,
        errorCode: "NOT_FOUND",
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      errorCode: "EXECUTION_ERROR",
      message: errorMessage,
    });
  }
};

/**
 * Execute a SELL order
 * POST /trading/sell
 * Body: { instrumentId, qty, product, limitPrice? }
 */
export const sellOrder = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    const { exchangeToken, qty, product, limitPrice } = req.body;

    // Validate required fields
    if (!exchangeToken || !qty || !product) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: exchangeToken, qty, product",
      });
    }

    // Validate product type
    if (product !== "CNC" && product !== "MIS") {
      return res.status(400).json({
        success: false,
        message: "Invalid product type. Must be 'CNC' or 'MIS'",
      });
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      return res.status(404).json({
        success: false,
        message: "Instrument not found",
      });
    }

    // Execute sell order
    const sellInput: any = {
      userId,
      instrumentId: instrument.id,
      qty: parseInt(qty),
      product: product as TradeType,
    };

    if (limitPrice) {
      sellInput.limitPrice = parseFloat(limitPrice);
    }

    const result = await executeSell(sellInput);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Sell order error:", error);

    // Categorize error types for better user feedback
    const errorMessage =
      error instanceof Error ? error.message : "Failed to execute sell order";

    if (
      errorMessage.includes("Insufficient quantity") ||
      errorMessage.includes("No open")
    ) {
      return res.status(400).json({
        success: false,
        errorCode: "INSUFFICIENT_QUANTITY",
        message: errorMessage,
      });
    }

    if (
      errorMessage.includes("validation failed") ||
      errorMessage.includes("not allowed")
    ) {
      return res.status(400).json({
        success: false,
        errorCode: "VALIDATION_ERROR",
        message: errorMessage,
      });
    }

    if (errorMessage.includes("not found")) {
      return res.status(404).json({
        success: false,
        errorCode: "NOT_FOUND",
        message: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      errorCode: "EXECUTION_ERROR",
      message: errorMessage,
    });
  }
};

/**
 * Get user's positions
 * GET /trading/positions
 * Query params: product? (CNC or MIS), instrumentId?
 */
export const getPositions = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    const { product, instrumentId } = req.query;

    // Build query filters
    const where: any = {
      userId,
      isOpen: true,
    };

    if (product && (product === "CNC" || product === "MIS")) {
      where.product = product;
    }

    if (instrumentId && typeof instrumentId === "string") {
      where.instrumentId = instrumentId;
    }

    // Fetch positions with related data
    const positions = await prisma.position.findMany({
      where,
      include: {
        instrument: true,
        lots: {
          where: {
            remainingQty: { gt: 0 },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Last 10 transactions
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Enrich positions with unrealized PnL
    const enrichedPositions = await Promise.all(
      positions.map(async (position) => {
        try {
          // Get current LTP
          const ltp = await getLivePrice(
            position.instrument.tradingSymbol,
            position.instrument.exchange,
            position.instrument.type,
            position.instrument.exchangeToken
          );

          // Calculate unrealized PnL
          const unrealizedPnL = calculateTotalUnrealizedPnL(position.lots, ltp);
          const totalPnL = position.realizedPnl + unrealizedPnL;
          const investedValue = position.avgPrice * position.qty;
          const currentValue = ltp * position.qty;

          return {
            id: position.id,
            instrument: {
              id: position.instrument.id,
              tradingSymbol: position.instrument.tradingSymbol,
              name: position.instrument.name,
              type: position.instrument.type,
              exchange: position.instrument.exchange,
              segment: position.instrument.segment,
              searchId: position.instrument.searchId,
            },
            product: position.product,
            qty: position.qty,
            avgPrice: position.avgPrice,
            currentPrice: ltp,
            investedValue,
            currentValue,
            realizedPnL: position.realizedPnl,
            unrealizedPnL,
            totalPnL,
            pnlPercentage:
              investedValue > 0 ? (totalPnL / investedValue) * 100 : 0,
            lots: position.lots.map((lot) => ({
              id: lot.id,
              totalQty: lot.totalQty,
              remainingQty: lot.remainingQty,
              buyPrice: lot.buyPrice,
              unrealizedPnL: (ltp - lot.buyPrice) * lot.remainingQty,
              createdAt: lot.createdAt,
            })),
            recentTransactions: position.transactions.map((txn) => ({
              id: txn.id,
              side: txn.side,
              qty: txn.qty,
              price: txn.price,
              realizedPnL: txn.realizedPnl,
              fees: txn.fees,
              createdAt: txn.createdAt,
            })),
            createdAt: position.createdAt,
            updatedAt: position.updatedAt,
          };
        } catch (error) {
          console.error(`Error enriching position ${position.id}:`, error);
          // Return position with fallback values if live price fetch fails
          return {
            id: position.id,
            instrument: {
              id: position.instrument.id,
              tradingSymbol: position.instrument.tradingSymbol,
              name: position.instrument.name,
              type: position.instrument.type,
              exchange: position.instrument.exchange,
              segment: position.instrument.segment,
              searchId: position.instrument.searchId,
            },
            product: position.product,
            qty: position.qty,
            avgPrice: position.avgPrice,
            currentPrice: position.avgPrice,
            investedValue: position.avgPrice * position.qty,
            currentValue: position.avgPrice * position.qty,
            realizedPnL: position.realizedPnl,
            unrealizedPnL: 0,
            totalPnL: position.realizedPnl,
            pnlPercentage: 0,
            lots: position.lots,
            recentTransactions: position.transactions,
            createdAt: position.createdAt,
            updatedAt: position.updatedAt,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      positions: enrichedPositions,
      count: enrichedPositions.length,
    });
  } catch (error) {
    console.error("Get positions error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch positions",
    });
  }
};

/**
 * Get position details by ID
 * GET /trading/positions/:positionId
 */
export const getPositionById = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    const { positionId } = req.params;

    if (!positionId) {
      return res.status(400).json({
        success: false,
        message: "Position ID is required",
      });
    }

    const position = await prisma.position.findFirst({
      where: {
        id: positionId,
        userId,
      },
      include: {
        instrument: true,
        lots: {
          orderBy: {
            createdAt: "asc",
          },
        },
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }

    // Get current LTP
    const ltp = await getLivePrice(
      position.instrument.tradingSymbol,
      position.instrument.exchange,
      position.instrument.type,
      position.instrument.exchangeToken
    );

    // Calculate metrics
    const unrealizedPnL = calculateTotalUnrealizedPnL(position.lots, ltp);
    const totalPnL = position.realizedPnl + unrealizedPnL;
    const investedValue = position.avgPrice * position.qty;
    const currentValue = ltp * position.qty;

    return res.status(200).json({
      success: true,
      position: {
        id: position.id,
        instrument: position.instrument,
        product: position.product,
        qty: position.qty,
        avgPrice: position.avgPrice,
        currentPrice: ltp,
        investedValue,
        currentValue,
        realizedPnL: position.realizedPnl,
        unrealizedPnL,
        totalPnL,
        pnlPercentage: investedValue > 0 ? (totalPnL / investedValue) * 100 : 0,
        isOpen: position.isOpen,
        lots: position.lots,
        transactions: position.transactions,
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get position by ID error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch position",
    });
  }
};

/**
 * Get user's transaction history
 * GET /trading/transactions
 * Query: limit?, offset?, side?, product?
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user not authenticated",
      });
    }

    const limit = parseInt((req.query.limit as string) || "100");
    const offset = parseInt((req.query.offset as string) || "0");
    const side = req.query.side as "BUY" | "SELL" | undefined;
    const product = req.query.product as "CNC" | "MIS" | undefined;

    // Build where clause
    const where: any = { userId };
    if (side) where.side = side;
    if (product) where.product = product;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        instrument: {
          select: {
            id: true,
            tradingSymbol: true,
            name: true,
            type: true,
            exchange: true,
            segment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.transaction.count({ where });

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch transactions",
    });
  }
};
