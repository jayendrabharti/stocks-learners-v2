/**
 * Leaderboard Service
 * Calculate and manage event leaderboards
 */

import prisma from "@/database/client.js";
import { calculateEventPortfolio } from "./eventAccountService.js";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  totalPnL: number;
  totalPnLPercentage: number;
  portfolioValue: number;
  investedValue: number;
  totalPositions: number;
  profitablePositions: number;
}

/**
 * Calculate event leaderboard
 */
export async function calculateEventLeaderboard(
  eventId: string
): Promise<LeaderboardEntry[]> {
  try {
    // Get all confirmed registrations for the event
    const registrations = await prisma.eventRegistration.findMany({
      where: {
        eventId,
        status: "CONFIRMED",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        eventAccount: true,
      },
    });

    // Calculate portfolio for each participant IN PARALLEL
    const leaderboardData: Array<{
      userId: string;
      userName: string | null;
      userAvatar: string | null;
      totalPnL: number;
      totalPnLPercentage: number;
      portfolioValue: number;
      investedValue: number;
      totalPositions: number;
      profitablePositions: number;
    }> = [];

    // Create promises for all portfolio calculations
    const portfolioPromises = registrations.map(async (registration) => {
      if (!registration.eventAccount) {
        return null;
      }

      try {
        const portfolio = await calculateEventPortfolio(
          registration.eventAccount.id
        );

        return {
          userId: registration.userId,
          userName: registration.user.name,
          userAvatar: registration.user.avatar,
          totalPnL: portfolio.totalPnL,
          totalPnLPercentage: portfolio.totalPnLPercentage,
          portfolioValue: portfolio.totalPortfolioValue,
          investedValue: portfolio.totalInvestedValue,
          totalPositions: portfolio.stats.totalPositions,
          profitablePositions: portfolio.stats.profitablePositions,
        };
      } catch (error) {
        console.error(
          `Error calculating portfolio for user ${registration.userId}:`,
          error
        );
        // Return with zero values if calculation fails
        return {
          userId: registration.userId,
          userName: registration.user.name,
          userAvatar: registration.user.avatar,
          totalPnL: 0,
          totalPnLPercentage: 0,
          portfolioValue: 0,
          investedValue: 0,
          totalPositions: 0,
          profitablePositions: 0,
        };
      }
    });

    // Execute all portfolio calculations in parallel
    const portfolioResults = await Promise.allSettled(portfolioPromises);

    // Collect results
    for (const result of portfolioResults) {
      if (result.status === 'fulfilled' && result.value) {
        leaderboardData.push(result.value);
      }
    }

    // Sort by total P&L (descending)
    leaderboardData.sort((a, b) => b.totalPnL - a.totalPnL);

    // Add ranks with proper tie handling
    const leaderboard: LeaderboardEntry[] = [];
    let currentRank = 1;
    
    for (let i = 0; i < leaderboardData.length; i++) {
      const currentEntry = leaderboardData[i];
      const previousEntry = leaderboardData[i - 1];
      
      if (!currentEntry) continue; // Type guard
      
      // If not the first entry and P&L is different from previous, update rank
      if (i > 0 && previousEntry && currentEntry.totalPnL !== previousEntry.totalPnL) {
        currentRank = i + 1; // Rank skips for ties
      }
      
      leaderboard.push({
        rank: currentRank,
        ...currentEntry,
      });
    }

    return leaderboard;
  } catch (error) {
    console.error("Calculate event leaderboard error:", error);
    throw new Error("Failed to calculate leaderboard");
  }
}

/**
 * Get user's rank in event
 */
export async function getUserRankInEvent(
  eventId: string,
  userId: string
): Promise<number | null> {
  try {
    const leaderboard = await calculateEventLeaderboard(eventId);
    const userEntry = leaderboard.find((entry) => entry.userId === userId);

    return userEntry ? userEntry.rank : null;
  } catch (error) {
    console.error("Get user rank error:", error);
    return null;
  }
}

/**
 * Get top N participants
 */
export async function getTopParticipants(
  eventId: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await calculateEventLeaderboard(eventId);
    return leaderboard.slice(0, limit);
  } catch (error) {
    console.error("Get top participants error:", error);
    throw new Error("Failed to get top participants");
  }
}
