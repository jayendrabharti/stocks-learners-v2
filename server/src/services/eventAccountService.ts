/**
 * Event Account Service
 * Manages event-specific trading accounts
 */

import prisma from "@/database/client.js";
import { calculatePortfolioStats } from "@/services/portfolioService.js";
import { fromDecimal } from "@/utils/currency";

/**
 * Create event account after successful registration
 */
export async function createEventAccount(
  registrationId: string,
  initialBalance: number
) {
  try {
    const eventAccount = await prisma.eventAccount.create({
      data: {
        registrationId,
        cash: initialBalance,
        usedMargin: 0,
      },
    });

    return eventAccount;
  } catch (error) {
    console.error("Event account creation error:", error);
    throw new Error("Failed to create event account");
  }
}

/**
 * Get event account balance
 */
export async function getEventAccountBalance(eventAccountId: string) {
  try {
    const account = await prisma.eventAccount.findUnique({
      where: { id: eventAccountId },
    });

    if (!account) {
      throw new Error("Event account not found");
    }

    return {
      cash: account.cash,
      usedMargin: account.usedMargin,
      availableMargin: account.cash, // Cash already excludes used margin
    };
  } catch (error) {
    console.error("Get event account balance error:", error);
    throw error;
  }
}

/**
 * Calculate event portfolio
 */
/**
 * Calculate event portfolio
 */
export async function calculateEventPortfolio(eventAccountId: string) {
  try {
    // Get account
    const account = await prisma.eventAccount.findUnique({
      where: { id: eventAccountId },
    });

    if (!account) {
      throw new Error("Event account not found");
    }

    // Get all open positions
    const positions = await prisma.eventPosition.findMany({
      where: {
        eventAccountId,
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

    // Get all positions (including closed) for total realized P&L
    const allPositions = await prisma.eventPosition.findMany({
      where: { eventAccountId },
      select: {
        realizedPnl: true,
      },
    });

    // Calculate total realized P&L from ALL positions
    const totalRealizedPnLAllTime = allPositions.reduce(
      (sum, p) => sum + fromDecimal(p.realizedPnl),
      0
    );

    // Get all transactions for total fees
    const allTransactions = await prisma.eventTransaction.findMany({
      where: { eventAccountId },
      select: { fees: true },
    });

    const totalFeesPaid = allTransactions.reduce(
      (sum, t) => sum + fromDecimal(t.fees),
      0
    );

    // Convert to portfolio-compatible format
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

    return portfolio;
  } catch (error) {
    console.error("Calculate event portfolio error:", error);
    throw error;
  }
}

/**
 * Get event account by registration ID
 */
export async function getEventAccountByRegistrationId(registrationId: string) {
  try {
    const account = await prisma.eventAccount.findUnique({
      where: { registrationId },
      include: {
        registration: {
          include: {
            event: true,
            user: true,
          },
        },
      },
    });

    return account;
  } catch (error) {
    console.error("Get event account error:", error);
    return null;
  }
}
