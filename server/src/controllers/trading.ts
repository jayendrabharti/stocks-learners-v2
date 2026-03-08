/**
 * Trading Controller
 * Handles BUY, SELL, and position management endpoints
 */

import { Request, Response } from "express";
import prisma from "@/database/client";
import { fromDecimal } from "@/utils/currency";
import { executeBuy, executeSell } from "@/utils/trading";
import { getLivePrice } from "@/utils/trading/livePrice";
import { calculateTotalUnrealizedPnL } from "@/utils/trading/calculatePnL";
import { AppError, ErrorCode, handleControllerError } from "@/utils/errors";
import type { TradeType } from "@/database/generated/enums";

/**
 * Execute a BUY order
 * POST /trading/buy
 * Body: { instrumentId, qty, product }
 */
export const buyOrder = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const { exchangeToken, qty, product } = req.body;

    // Validate required fields
    if (!exchangeToken || qty === undefined || qty === null || !product) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Missing required fields: exchangeToken, qty, product",
      );
    }

    // Validate product type
    if (product !== "CNC" && product !== "MIS") {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Invalid product type. Must be 'CNC' or 'MIS'",
      );
    }

    // Validate and parse quantity
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new AppError(
        ErrorCode.TRADING_INVALID_QUANTITY,
        "Invalid quantity. Must be a positive number",
      );
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      throw new AppError(
        ErrorCode.INSTRUMENT_NOT_FOUND,
        `Instrument with token ${exchangeToken} not found`,
      );
    }

    // Execute buy order
    const result = await executeBuy({
      userId,
      instrumentId: instrument.id,
      qty: parsedQty,
      product: product as TradeType,
    });

    return res.status(200).json(result);
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.TRADING_ORDER_FAILED,
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Execute a SELL order
 * POST /trading/sell
 * Body: { instrumentId, qty, product }
 */
export const sellOrder = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const { exchangeToken, qty, product } = req.body;

    // Validate required fields
    if (!exchangeToken || qty === undefined || qty === null || !product) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Missing required fields: exchangeToken, qty, product",
      );
    }

    // Validate product type
    if (product !== "CNC" && product !== "MIS") {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Invalid product type. Must be 'CNC' or 'MIS'",
      );
    }

    // Validate and parse quantity
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new AppError(
        ErrorCode.TRADING_INVALID_QUANTITY,
        "Invalid quantity. Must be a positive number",
      );
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      throw new AppError(
        ErrorCode.INSTRUMENT_NOT_FOUND,
        `Instrument with token ${exchangeToken} not found`,
      );
    }

    // Execute sell order
    const result = await executeSell({
      userId,
      instrumentId: instrument.id,
      qty: parsedQty,
      product: product as TradeType,
    });

    return res.status(200).json(result);
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.TRADING_ORDER_FAILED,
    );
    return res.status(statusCode).json(body);
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
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
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
            position.instrument.exchangeToken,
          );

          // Calculate unrealized PnL
          const unrealizedPnL = calculateTotalUnrealizedPnL(position.lots, ltp);
          const realizedPnl = fromDecimal(position.realizedPnl);
          const avgPrice = fromDecimal(position.avgPrice);
          const totalPnL = realizedPnl + unrealizedPnL;
          const investedValue = avgPrice * position.qty;
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
              exchangeToken: position.instrument.exchangeToken,
              searchId: position.instrument.searchId,
            },
            product: position.product,
            qty: position.qty,
            avgPrice: avgPrice,
            currentPrice: ltp,
            investedValue,
            currentValue,
            realizedPnL: realizedPnl,
            unrealizedPnL,
            totalPnL,
            pnlPercentage:
              investedValue > 0 ? (totalPnL / investedValue) * 100 : 0,
            lots: position.lots.map((lot) => ({
              id: lot.id,
              totalQty: lot.totalQty,
              remainingQty: lot.remainingQty,
              buyPrice: fromDecimal(lot.buyPrice),
              unrealizedPnL:
                (ltp - fromDecimal(lot.buyPrice)) * lot.remainingQty,
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
          const avgPriceFallback = fromDecimal(position.avgPrice);
          const realizedPnlFallback = fromDecimal(position.realizedPnl);
          return {
            id: position.id,
            instrument: {
              id: position.instrument.id,
              tradingSymbol: position.instrument.tradingSymbol,
              name: position.instrument.name,
              type: position.instrument.type,
              exchange: position.instrument.exchange,
              segment: position.instrument.segment,
              exchangeToken: position.instrument.exchangeToken,
              searchId: position.instrument.searchId,
            },
            product: position.product,
            qty: position.qty,
            avgPrice: avgPriceFallback,
            currentPrice: avgPriceFallback,
            investedValue: avgPriceFallback * position.qty,
            currentValue: avgPriceFallback * position.qty,
            realizedPnL: realizedPnlFallback,
            unrealizedPnL: 0,
            totalPnL: position.realizedPnl,
            pnlPercentage: 0,
            lots: position.lots,
            recentTransactions: position.transactions,
            createdAt: position.createdAt,
            updatedAt: position.updatedAt,
          };
        }
      }),
    );

    return res.status(200).json({
      success: true,
      positions: enrichedPositions,
      count: enrichedPositions.length,
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR,
    );
    return res.status(statusCode).json(body);
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
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const { positionId } = req.params;

    if (!positionId) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Position ID is required",
      );
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
      throw new AppError(ErrorCode.POSITION_NOT_FOUND);
    }

    // Get current LTP
    const ltp = await getLivePrice(
      position.instrument.tradingSymbol,
      position.instrument.exchange,
      position.instrument.type,
      position.instrument.exchangeToken,
    );

    // Calculate metrics
    const unrealizedPnL = calculateTotalUnrealizedPnL(position.lots, ltp);
    const realizedPnl = fromDecimal(position.realizedPnl);
    const avgPrice = fromDecimal(position.avgPrice);
    const totalPnL = realizedPnl + unrealizedPnL;
    const investedValue = avgPrice * position.qty;
    const currentValue = ltp * position.qty;

    return res.status(200).json({
      success: true,
      position: {
        id: position.id,
        instrument: position.instrument,
        product: position.product,
        qty: position.qty,
        avgPrice: avgPrice,
        currentPrice: ltp,
        investedValue,
        currentValue,
        realizedPnL: realizedPnl,
        unrealizedPnL,
        totalPnL,
        pnlPercentage: investedValue > 0 ? (totalPnL / investedValue) * 100 : 0,
        isOpen: position.isOpen,
        lots: position.lots.map((l) => ({
          ...l,
          buyPrice: fromDecimal(l.buyPrice),
        })),
        transactions: position.transactions,
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
      },
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR,
    );
    return res.status(statusCode).json(body);
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
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const limit = parseInt((req.query.limit as string) || "100");
    const offset = parseInt((req.query.offset as string) || "0");
    const side = req.query.side as "BUY" | "SELL" | undefined;
    const product = req.query.product as "CNC" | "MIS" | undefined;

    // Validate limit to prevent excessive queries
    if (limit < 1 || limit > 1000) {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Limit must be between 1 and 1000",
      );
    }

    // Validate offset
    if (offset < 0) {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Offset must be non-negative",
      );
    }

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
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR,
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Execute a basket of orders (multiple orders at once)
 * POST /trading/basket
 * Body: { orders: [{ exchangeToken, qty, product, side }] }
 */
export const executeBasketOrder = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "orders must be a non-empty array",
      );
    }

    if (orders.length > 10) {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Maximum 10 orders per basket",
      );
    }

    // Validate each order in the basket
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (!order.exchangeToken || !order.qty || !order.product || !order.side) {
        throw new AppError(
          ErrorCode.VALIDATION_REQUIRED_FIELD,
          `Order ${i + 1}: Missing required fields (exchangeToken, qty, product, side)`,
        );
      }
      if (order.side !== "BUY" && order.side !== "SELL") {
        throw new AppError(
          ErrorCode.VALIDATION_INVALID_VALUE,
          `Order ${i + 1}: side must be 'BUY' or 'SELL'`,
        );
      }
      if (order.product !== "CNC" && order.product !== "MIS") {
        throw new AppError(
          ErrorCode.VALIDATION_INVALID_VALUE,
          `Order ${i + 1}: product must be 'CNC' or 'MIS'`,
        );
      }
      const parsedQty = parseInt(order.qty);
      if (isNaN(parsedQty) || parsedQty <= 0) {
        throw new AppError(
          ErrorCode.TRADING_INVALID_QUANTITY,
          `Order ${i + 1}: Invalid quantity`,
        );
      }
    }

    // Execute each order sequentially, collecting results
    const results: Array<{
      index: number;
      exchangeToken: string;
      side: string;
      success: boolean;
      data?: any;
      error?: string;
    }> = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      try {
        const instrument = await prisma.instrument.findUnique({
          where: { exchangeToken: order.exchangeToken },
        });

        if (!instrument) {
          results.push({
            index: i,
            exchangeToken: order.exchangeToken,
            side: order.side,
            success: false,
            error: `Instrument not found: ${order.exchangeToken}`,
          });
          continue;
        }

        const parsedQty = parseInt(order.qty);

        if (order.side === "BUY") {
          const result = await executeBuy({
            userId,
            instrumentId: instrument.id,
            qty: parsedQty,
            product: order.product as TradeType,
          });
          results.push({
            index: i,
            exchangeToken: order.exchangeToken,
            side: order.side,
            success: result.success,
            data: result,
          });
        } else {
          const result = await executeSell({
            userId,
            instrumentId: instrument.id,
            qty: parsedQty,
            product: order.product as TradeType,
          });
          results.push({
            index: i,
            exchangeToken: order.exchangeToken,
            side: order.side,
            success: result.success,
            data: result,
          });
        }
      } catch (orderError: any) {
        results.push({
          index: i,
          exchangeToken: order.exchangeToken,
          side: order.side,
          success: false,
          error: orderError?.message || "Order execution failed",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return res.status(200).json({
      success: failCount === 0,
      message: `Basket executed: ${successCount} succeeded, ${failCount} failed out of ${orders.length} orders`,
      results,
      summary: {
        total: orders.length,
        succeeded: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.TRADING_ORDER_FAILED,
    );
    return res.status(statusCode).json(body);
  }
};
