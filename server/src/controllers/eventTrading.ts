/**
 * Event Trading Controller
 * Handles trading operations within events
 */

import { Request, Response } from "express";
import prisma from "@/database/client.js";
import { executeEventBuy } from "@/utils/trading/eventTrading/executeEventBuy.js";
import { executeEventSell } from "@/utils/trading/eventTrading/executeEventSell.js";
import { calculateEventPortfolio } from "@/services/eventAccountService.js";
import { AppError, ErrorCode, handleControllerError } from "@/utils/errors";

/**
 * Execute BUY order in event
 * POST /events/:eventId/trading/buy
 */
export const buyOrder = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Event ID is required"
      );
    }

    const { exchangeToken, qty, product } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    // Validate required fields
    if (!exchangeToken || !qty || !product) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Missing required fields: exchangeToken, qty, product"
      );
    }

    // Validate and parse quantity
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new AppError(
        ErrorCode.TRADING_INVALID_QUANTITY,
        "Invalid quantity. Must be a positive number"
      );
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      throw new AppError(
        ErrorCode.INSTRUMENT_NOT_FOUND,
        `Instrument with token ${exchangeToken} not found`
      );
    }

    // Get event and validate it's active and within trading window
    const event = await prisma.event.findUnique({
      where: { id: eventId as string },
    });

    if (!event) {
      throw new AppError(ErrorCode.EVENT_NOT_FOUND);
    }

    if (!event.isActive) {
      throw new AppError(ErrorCode.EVENT_NOT_ACTIVE);
    }

    // Validate event timeframe (with proper UTC handling)
    const now = new Date();
    if (now < event.eventStartAt) {
      throw new AppError(ErrorCode.EVENT_NOT_STARTED);
    }

    if (now > event.eventEndAt) {
      throw new AppError(ErrorCode.EVENT_ENDED);
    }

    // Get user's event account
    const registration = (await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: eventId as string,
        status: "CONFIRMED",
      },
      include: {
        eventAccount: true,
      },
    })) as any;

    if (!registration || !registration.eventAccount) {
      throw new AppError(
        ErrorCode.EVENT_NOT_REGISTERED,
        "Event account not found or registration not confirmed"
      );
    }

    // Execute buy order (note: limitPrice is not supported)
    const result = await executeEventBuy({
      eventAccountId: registration.eventAccount.id,
      instrumentId: instrument.id,
      qty: parsedQty,
      product,
    });

    return res.status(200).json(result);
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.TRADING_ORDER_FAILED
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Execute SELL order in event
 * POST /events/:eventId/trading/sell
 */
export const sellOrder = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Event ID is required"
      );
    }

    const { exchangeToken, qty, product } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    // Validate required fields
    if (!exchangeToken || !qty || !product) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Missing required fields: exchangeToken, qty, product"
      );
    }

    // Validate and parse quantity
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new AppError(
        ErrorCode.TRADING_INVALID_QUANTITY,
        "Invalid quantity. Must be a positive number"
      );
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      throw new AppError(
        ErrorCode.INSTRUMENT_NOT_FOUND,
        `Instrument with token ${exchangeToken} not found`
      );
    }

    // Get event and validate it's active and within trading window
    const event = await prisma.event.findUnique({
      where: { id: eventId as string },
    });

    if (!event) {
      throw new AppError(ErrorCode.EVENT_NOT_FOUND);
    }

    if (!event.isActive) {
      throw new AppError(ErrorCode.EVENT_NOT_ACTIVE);
    }

    // Validate event timeframe
    const now = new Date();
    if (now < event.eventStartAt) {
      throw new AppError(ErrorCode.EVENT_NOT_STARTED);
    }

    if (now > event.eventEndAt) {
      throw new AppError(ErrorCode.EVENT_ENDED);
    }

    // Get user's event account
    const registration = (await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: eventId as string,
        status: "CONFIRMED",
      },
      include: {
        eventAccount: true,
      },
    })) as any;

    if (!registration || !registration.eventAccount) {
      throw new AppError(
        ErrorCode.EVENT_NOT_REGISTERED,
        "Event account not found or registration not confirmed"
      );
    }

    // Execute sell order (note: limitPrice is not supported)
    const result = await executeEventSell({
      eventAccountId: registration.eventAccount.id,
      instrumentId: instrument.id,
      qty: parsedQty,
      product,
    });

    return res.status(200).json(result);
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.TRADING_ORDER_FAILED
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Get event positions
 * GET /events/:eventId/trading/positions
 */
export const getPositions = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { product } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    if (!eventId) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Event ID is required"
      );
    }

    // Get user's event account
    const registration = (await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: eventId as string,
        status: "CONFIRMED",
      },
      include: {
        eventAccount: true,
      },
    })) as any;

    if (!registration || !registration.eventAccount) {
      throw new AppError(
        ErrorCode.EVENT_NOT_REGISTERED,
        "Event account not found"
      );
    }

    // Build where clause
    const where: any = {
      eventAccountId: registration.eventAccount.id,
      isOpen: true,
    };

    if (product) {
      where.product = product;
    }

    // Fetch positions
    const positions = await prisma.eventPosition.findMany({
      where,
      include: {
        instrument: true,
        lots: {
          where: {
            remainingQty: { gt: 0 },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      positions,
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Get event transactions
 * GET /events/:eventId/trading/transactions
 */
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { page = "1", limit = "50" } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    if (!eventId) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Event ID is required"
      );
    }

    // Get user's event account
    const registration = (await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: eventId as string,
        status: "CONFIRMED",
      },
      include: {
        eventAccount: true,
      },
    })) as any;

    if (!registration || !registration.eventAccount) {
      throw new AppError(
        ErrorCode.EVENT_NOT_REGISTERED,
        "Event account not found"
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Fetch transactions
    const [transactions, total] = await Promise.all([
      prisma.eventTransaction.findMany({
        where: {
          eventAccountId: registration.eventAccount.id,
        },
        include: {
          instrument: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      prisma.eventTransaction.count({
        where: {
          eventAccountId: registration.eventAccount.id,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR
    );
    return res.status(statusCode).json(body);
  }
};

/**
 * Get event portfolio
 * GET /events/:eventId/portfolio
 */
export const getEventPortfolio = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    if (!eventId) {
      throw new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        "Event ID is required"
      );
    }

    // Get user's event account
    const registration = (await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: eventId as string,
        status: "CONFIRMED",
      },
      include: {
        eventAccount: true,
      },
    })) as any;

    if (!registration || !registration.eventAccount) {
      throw new AppError(
        ErrorCode.EVENT_NOT_REGISTERED,
        "Event account not found"
      );
    }

    // Calculate portfolio
    const portfolio = await calculateEventPortfolio(
      registration.eventAccount.id
    );

    return res.status(200).json(portfolio);
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR
    );
    return res.status(statusCode).json(body);
  }
};
