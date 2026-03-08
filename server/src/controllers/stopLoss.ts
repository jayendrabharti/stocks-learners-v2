/**
 * Stop Loss Controller
 * Handles create, list, cancel stop loss orders
 */

import { Request, Response } from "express";
import prisma from "@/database/client";
import { fromDecimal } from "@/utils/currency";
import { AppError, ErrorCode, handleControllerError } from "@/utils/errors";

/**
 * Create a stop loss order for a position
 * POST /stop-loss
 * Body: { positionId, triggerPrice, qty? }
 */
export const createStopLoss = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - validToken middleware adds user
    const userId = req.user?.id;
    if (!userId) throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);

    const { positionId, triggerPrice, qty } = req.body;

    if (!positionId || triggerPrice === undefined || triggerPrice === null) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Missing required fields: positionId, triggerPrice",
      );
    }

    const parsedTriggerPrice = parseFloat(triggerPrice);
    if (isNaN(parsedTriggerPrice) || parsedTriggerPrice <= 0) {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Trigger price must be a positive number",
      );
    }

    // Verify position exists and belongs to user
    const position = await prisma.position.findFirst({
      where: {
        id: positionId,
        userId,
        isOpen: true,
      },
      include: {
        instrument: {
          select: {
            id: true,
            tradingSymbol: true,
            name: true,
          },
        },
      },
    });

    if (!position) {
      throw new AppError(
        ErrorCode.INSTRUMENT_NOT_FOUND,
        "Position not found or already closed",
      );
    }

    if (position.qty <= 0) {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "Position has no holdings to protect with stop loss",
      );
    }

    // Validate qty
    const parsedQty = qty ? parseInt(qty) : 0;
    if (parsedQty < 0) {
      throw new AppError(
        ErrorCode.TRADING_INVALID_QUANTITY,
        "Quantity must be positive or 0 (for full position)",
      );
    }
    if (parsedQty > position.qty) {
      throw new AppError(
        ErrorCode.TRADING_INVALID_QUANTITY,
        `Quantity (${parsedQty}) exceeds position quantity (${position.qty})`,
      );
    }

    // Check for existing active stop loss on this position
    const existing = await prisma.stopLossOrder.findFirst({
      where: {
        positionId,
        userId,
        status: "ACTIVE",
      },
    });

    if (existing) {
      throw new AppError(
        ErrorCode.VALIDATION_INVALID_VALUE,
        "An active stop loss already exists for this position. Cancel it first.",
      );
    }

    const stopLoss = await prisma.stopLossOrder.create({
      data: {
        userId,
        positionId,
        triggerPrice: parsedTriggerPrice,
        qty: parsedQty,
      },
    });

    return res.status(201).json({
      success: true,
      stopLoss: {
        id: stopLoss.id,
        positionId: stopLoss.positionId,
        triggerPrice: fromDecimal(stopLoss.triggerPrice),
        qty: stopLoss.qty,
        status: stopLoss.status,
        createdAt: stopLoss.createdAt,
      },
      message: `Stop loss set at ₹${parsedTriggerPrice.toFixed(2)} for ${position.instrument.tradingSymbol}`,
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.TRADING_ORDER_FAILED,
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Get all stop loss orders for the user
 * GET /stop-loss
 * Query: status? (ACTIVE, TRIGGERED, EXECUTED, FAILED, CANCELLED)
 */
export const getStopLossOrders = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);

    const status = req.query.status as string | undefined;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const orders = await prisma.stopLossOrder.findMany({
      where,
      include: {
        position: {
          include: {
            instrument: {
              select: {
                id: true,
                tradingSymbol: true,
                name: true,
                exchange: true,
                segment: true,
                exchangeToken: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = orders.map((order) => ({
      id: order.id,
      positionId: order.positionId,
      instrument: order.position.instrument,
      triggerPrice: fromDecimal(order.triggerPrice),
      qty: order.qty || order.position.qty,
      status: order.status,
      executedPrice: order.executedPrice
        ? fromDecimal(order.executedPrice)
        : null,
      errorMessage: order.errorMessage,
      createdAt: order.createdAt,
      triggeredAt: order.triggeredAt,
    }));

    return res.status(200).json({
      success: true,
      stopLossOrders: formatted,
      count: formatted.length,
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
 * Cancel a stop loss order
 * DELETE /stop-loss/:id
 */
export const cancelStopLoss = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.id;
    if (!userId) throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);

    const { id } = req.params;
    if (!id) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Stop loss order ID is required",
      );
    }

    const order = await prisma.stopLossOrder.findFirst({
      where: {
        id,
        userId,
        status: "ACTIVE",
      },
    });

    if (!order) {
      throw new AppError(
        ErrorCode.INSTRUMENT_NOT_FOUND,
        "Active stop loss order not found",
      );
    }

    await prisma.stopLossOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return res.status(200).json({
      success: true,
      message: "Stop loss order cancelled",
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR,
    );
    return res.status(statusCode).json(body);
  }
};
