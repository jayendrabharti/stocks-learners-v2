import { Request, Response } from "express";
import prisma from "@/database/client";
import { fromDecimal } from "@/utils/currency";
import { calculatePortfolioStats } from "@/services/portfolioService";

/**
 * Get user's complete portfolio summary
 * GET /portfolio
 */
export const getPortfolio = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    // Get account details
    let account = await prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      // Create account if doesn't exist
      account = await prisma.account.create({
        data: {
          userId,
          cash: 0,
          usedMargin: 0,
        },
      });
    }

    // Get all open positions
    const positions = await prisma.position.findMany({
      where: {
        userId,
        isOpen: true,
      },
      include: {
        instrument: true,
        lots: {
          where: {
            remainingQty: { gt: 0 },
          },
        },
        transactions: true,
      },
    });

    // Get all positions (including closed) to calculate total realized P&L
    const allPositions = await prisma.position.findMany({
      where: { userId },
      select: {
        realizedPnl: true,
      },
    });

    // Calculate total realized P&L from ALL positions (open + closed)
    const totalRealizedPnLAllTime = allPositions.reduce(
      (sum, p) => sum + fromDecimal(p.realizedPnl),
      0
    );

    // Get all transactions to calculate total fees
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      select: { fees: true },
    });

    const totalFeesPaid = allTransactions.reduce(
      (sum, t) => sum + fromDecimal(t.fees),
      0
    );

    // Convert account and positions to portfolio-compatible format
    const portfolioAccount = {
      cash: fromDecimal(account.cash),
      usedMargin: fromDecimal(account.usedMargin),
    };

    const portfolioPositions = positions.map((p) => ({
      ...p,
      avgPrice: fromDecimal(p.avgPrice),
      realizedPnl: fromDecimal(p.realizedPnl),
      transactions: p.transactions.map((t) => ({ fees: fromDecimal(t.fees) })),
      lots: p.lots.map((l) => ({
        ...l,
        buyPrice: fromDecimal(l.buyPrice),
      })),
    }));

    // Use shared portfolio service
    const portfolio = await calculatePortfolioStats({
      account: portfolioAccount,
      openPositions: portfolioPositions,
      allPositionsRealizedPnl: totalRealizedPnLAllTime,
      totalFeesPaid,
    });

    return res.status(200).json({
      success: true,
      portfolio,
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
    });
  }
};
