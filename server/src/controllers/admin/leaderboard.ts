import { Request, Response } from "express";
import prisma from "@/database/client";

interface LeaderboardUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  totalPnL: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalInvested: number;
  holdingsValue: number;
  portfolioValue: number;
  createdAt: Date;
}

/**
 * Get leaderboard of all users sorted by total P&L
 * GET /admin/leaderboard
 */
export const getLeaderboard = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page = "1", limit = "50" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Calculate P&L for each user
    const leaderboardData: LeaderboardUser[] = [];

    for (const user of users) {
      try {
        // Get account
        const account = await prisma.account.findUnique({
          where: { userId: user.id },
        });

        if (!account) {
          // User has no account, skip
          continue;
        }

        // Get all positions (open and closed) for realized P&L
        const allPositions = await prisma.position.findMany({
          where: { userId: user.id },
          select: {
            realizedPnl: true,
            qty: true,
            avgPrice: true,
            isOpen: true,
          },
        });

        const totalRealizedPnL = allPositions.reduce(
          (sum, p) => sum + p.realizedPnl,
          0
        );

        // Get open positions for unrealized P&L
        const openPositions = await prisma.position.findMany({
          where: {
            userId: user.id,
            isOpen: true,
          },
          include: {
            lots: {
              where: {
                remainingQty: { gt: 0 },
              },
            },
            instrument: true,
          },
        });

        let totalUnrealizedPnL = 0;
        let totalInvested = 0;
        let totalCurrentValue = 0;

        // Calculate unrealized P&L for open positions
        for (const position of openPositions) {
          const investedValue = position.avgPrice * position.qty;
          totalInvested += investedValue;

          // Calculate unrealized P&L from lots
          const unrealizedPnL = position.lots.reduce((sum, lot) => {
            // Use avgPrice as proxy for current price (simplified)
            return sum + (position.avgPrice - lot.buyPrice) * lot.remainingQty;
          }, 0);

          totalUnrealizedPnL += unrealizedPnL;
          totalCurrentValue += position.avgPrice * position.qty;
        }

        const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
        const portfolioValue = account.cash + totalCurrentValue;

        leaderboardData.push({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          totalPnL,
          totalRealizedPnL,
          totalUnrealizedPnL,
          totalInvested,
          holdingsValue: totalCurrentValue,
          portfolioValue,
          createdAt: user.createdAt,
        });
      } catch (error) {
        console.error(`Error calculating P&L for user ${user.id}:`, error);
        // Continue with next user
      }
    }

    // Sort by total P&L (highest first)
    leaderboardData.sort((a, b) => b.totalPnL - a.totalPnL);

    // Add rank
    const rankedData = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    // Apply pagination
    const paginatedData = rankedData.slice(skip, skip + limitNum);
    const total = rankedData.length;

    return res.status(200).json({
      success: true,
      leaderboard: paginatedData,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
    });
  }
};
