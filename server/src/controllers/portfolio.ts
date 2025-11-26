import { Request, Response } from "express";
import prisma from "@/database/client";
import { getLivePrice } from "@/utils/trading/livePrice";
import { calculateTotalUnrealizedPnL } from "@/utils/trading/calculatePnL";

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
        isOpen: true,
      },
    });

    // Calculate total realized P&L from ALL positions (open + closed)
    const totalRealizedPnLAllTime = allPositions.reduce(
      (sum, p) => sum + p.realizedPnl,
      0
    );

    // Get all transactions to calculate total fees
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      select: { fees: true },
    });

    const totalFeesPaid = allTransactions.reduce((sum, t) => sum + t.fees, 0);

    // Calculate portfolio metrics
    let totalInvestedValue = 0;
    let totalCurrentValue = 0;
    let totalRealizedPnL = 0;
    let totalUnrealizedPnL = 0;
    let totalFees = 0;

    const holdingsByProduct = {
      CNC: [] as any[],
      MIS: [] as any[],
    };

    // Process each position
    const positionsWithPnL: Array<{
      position: (typeof positions)[0];
      unrealizedPnL: number;
      totalPnL: number;
    }> = [];

    for (const position of positions) {
      try {
        const ltp = await getLivePrice(
          position.instrument.tradingSymbol,
          position.instrument.exchange,
          position.instrument.type,
          position.instrument.exchangeToken
        );

        const investedValue = position.avgPrice * position.qty;
        const currentValue = ltp * position.qty;
        const unrealizedPnL = calculateTotalUnrealizedPnL(position.lots, ltp);
        const totalPnL = position.realizedPnl + unrealizedPnL;

        // Store for statistics calculation
        positionsWithPnL.push({
          position,
          unrealizedPnL,
          totalPnL,
        });

        // Calculate fees for this position from its transactions
        const positionFees = position.transactions.reduce(
          (sum, t) => sum + t.fees,
          0
        );

        totalInvestedValue += investedValue;
        totalCurrentValue += currentValue;
        // Note: totalRealizedPnL from open positions only (for breakdown)
        totalRealizedPnL += position.realizedPnl;
        totalUnrealizedPnL += unrealizedPnL;
        totalFees += positionFees;

        const holding = {
          positionId: position.id,
          product: position.product, // CNC or MIS
          instrument: {
            id: position.instrument.id,
            tradingSymbol: position.instrument.tradingSymbol,
            name: position.instrument.name,
            exchange: position.instrument.exchange,
            type: position.instrument.type,
            segment: position.instrument.segment,
            searchId: position.instrument.searchId,
          },
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
          dayChange: 0, // TODO: Calculate day change when we have previous close data
          dayChangePercentage: 0,
          lots: position.lots.map((lot) => ({
            id: lot.id,
            totalQty: lot.totalQty,
            remainingQty: lot.remainingQty,
            buyPrice: lot.buyPrice,
            unrealizedPnL: (ltp - lot.buyPrice) * lot.remainingQty,
            createdAt: lot.createdAt.toISOString(),
          })),
        };

        holdingsByProduct[position.product].push(holding);
      } catch (error) {
        console.error(`Error processing position ${position.id}:`, error);
      }
    }

    // Total P&L = All realized P&L (from all positions) + Current unrealized P&L (from open positions)
    const totalPnL = totalRealizedPnLAllTime + totalUnrealizedPnL;

    // All-time invested value = Current invested + Cash from sold positions + Fees - Realized P&L from closed
    // Simplified: totalInvestedValue only shows current holdings invested value
    const totalPnLPercentage =
      totalInvestedValue > 0 ? (totalPnL / totalInvestedValue) * 100 : 0;

    const availableMargin = account.cash - account.usedMargin;

    // Portfolio value = total cash + current value of all holdings
    // Note: usedMargin is cash blocked for margin positions, but it's still part of total cash
    const totalPortfolioValue = account.cash + totalCurrentValue;

    return res.status(200).json({
      success: true,
      portfolio: {
        // Account summary
        account: {
          totalCash: account.cash,
          usedMargin: account.usedMargin,
          availableMargin,
        },

        // Portfolio value
        totalPortfolioValue,
        totalInvestedValue, // Only from current open positions
        totalCurrentValue,

        // P&L summary
        totalRealizedPnL, // From open positions only
        totalRealizedPnLAllTime, // From ALL positions (open + closed)
        totalUnrealizedPnL,
        totalPnL, // All realized + current unrealized
        totalPnLPercentage,

        // Fees summary
        totalFeesPaid, // All fees ever paid
        totalFeesInOpenPositions: totalFees, // Fees attributable to current open positions

        // Holdings breakdown
        holdings: {
          CNC: {
            positions: holdingsByProduct.CNC,
            count: holdingsByProduct.CNC.length,
            totalValue: holdingsByProduct.CNC.reduce(
              (sum, h) => sum + h.currentValue,
              0
            ),
            totalPnL: holdingsByProduct.CNC.reduce(
              (sum, h) => sum + h.totalPnL,
              0
            ),
          },
          MIS: {
            positions: holdingsByProduct.MIS,
            count: holdingsByProduct.MIS.length,
            totalValue: holdingsByProduct.MIS.reduce(
              (sum, h) => sum + h.currentValue,
              0
            ),
            totalPnL: holdingsByProduct.MIS.reduce(
              (sum, h) => sum + h.totalPnL,
              0
            ),
          },
        },

        // Statistics
        stats: {
          totalPositions: positions.length,
          profitablePositions: positionsWithPnL.filter((p) => p.totalPnL > 0)
            .length,
          lossPositions: positionsWithPnL.filter((p) => p.totalPnL < 0).length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio",
    });
  }
};
