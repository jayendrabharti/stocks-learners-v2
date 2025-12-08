/**
 * Event Trading Controller
 * Handles trading operations within events
 */

import { Request, Response } from "express";
import prisma from "@/database/client.js";
import { executeEventBuy } from "@/utils/trading/eventTrading/executeEventBuy.js";
import { executeEventSell } from "@/utils/trading/eventTrading/executeEventSell.js";
import { calculateEventPortfolio } from "@/services/eventAccountService.js";

/**
 * Execute BUY order in event
 * POST /events/:eventId/trading/buy
 */
export const buyOrder = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
    }

    const { exchangeToken, qty, product, limitPrice } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    // Validate required fields
    if (!exchangeToken || !qty || !product) {
      return res.status(400).json({
        error: {
          message: "Missing required fields: exchangeToken, qty, product",
        },
      });
    }

    // Validate and parse quantity
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        error: { message: "Invalid quantity. Must be a positive number" },
      });
    }

    // Validate and parse limit price if provided
    let parsedLimitPrice: number | undefined;
    if (limitPrice !== undefined && limitPrice !== null && limitPrice !== "") {
      parsedLimitPrice = parseFloat(limitPrice);
      if (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0) {
        return res.status(400).json({
          error: { message: "Invalid limit price. Must be a positive number" },
        });
      }
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      return res.status(404).json({
        error: { message: "Instrument not found" },
      });
    }

    // Get event and validate it's active and within trading window
    const event = await prisma.event.findUnique({
      where: { id: eventId as string },
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    if (!event.isActive) {
      return res.status(400).json({
        error: { message: "Event is not active" },
      });
    }

    // Validate event timeframe (with proper UTC handling)
    const now = new Date();
    if (now < event.eventStartAt) {
      return res.status(400).json({
        error: { message: "Event trading has not started yet" },
      });
    }

    if (now > event.eventEndAt) {
      return res.status(400).json({
        error: { message: "Event trading has ended" },
      });
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
      return res.status(404).json({
        error: {
          message: "Event account not found or registration not confirmed",
        },
      });
    }

    // Execute buy order
    const result = await executeEventBuy({
      eventAccountId: registration.eventAccount.id,
      instrumentId: instrument.id,
      qty: parsedQty,
      product,
      limitPrice: parsedLimitPrice,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Event BUY order error:", error);
    return res.status(500).json({
      error: { message: error.message || "Error executing BUY order" },
    });
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
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
    }

    const { exchangeToken, qty, product, limitPrice } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    // Validate required fields
    if (!exchangeToken || !qty || !product) {
      return res.status(400).json({
        error: {
          message: "Missing required fields: exchangeToken, qty, product",
        },
      });
    }

    // Validate and parse quantity
    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        error: { message: "Invalid quantity. Must be a positive number" },
      });
    }

    // Validate and parse limit price if provided
    let parsedLimitPrice: number | undefined;
    if (limitPrice !== undefined && limitPrice !== null && limitPrice !== "") {
      parsedLimitPrice = parseFloat(limitPrice);
      if (isNaN(parsedLimitPrice) || parsedLimitPrice <= 0) {
        return res.status(400).json({
          error: { message: "Invalid limit price. Must be a positive number" },
        });
      }
    }

    // Find instrument by exchange token
    const instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (!instrument) {
      return res.status(404).json({
        error: { message: "Instrument not found" },
      });
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
      return res.status(404).json({
        error: {
          message: "Event account not found or registration not confirmed",
        },
      });
    }

    // Execute sell order
    const result = await executeEventSell({
      eventAccountId: registration.eventAccount.id,
      instrumentId: instrument.id,
      qty: parsedQty,
      product,
      limitPrice: parsedLimitPrice,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Event SELL order error:", error);
    return res.status(500).json({
      error: { message: error.message || "Error executing SELL order" },
    });
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
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
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
      return res.status(404).json({
        error: { message: "Event account not found" },
      });
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
    console.error("Error retrieving event positions:", error);
    return res.status(500).json({
      error: { message: "Error retrieving positions" },
    });
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
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
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
      return res.status(404).json({
        error: { message: "Event account not found" },
      });
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
    console.error("Error retrieving event transactions:", error);
    return res.status(500).json({
      error: { message: "Error retrieving transactions" },
    });
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
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID is required" },
      });
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
      return res.status(404).json({
        error: { message: "Event account not found" },
      });
    }

    // Calculate portfolio
    const portfolio = await calculateEventPortfolio(
      registration.eventAccount.id
    );

    return res.status(200).json(portfolio);
  } catch (error) {
    console.error("Error retrieving event portfolio:", error);
    return res.status(500).json({
      error: { message: "Error retrieving portfolio" },
    });
  }
};
