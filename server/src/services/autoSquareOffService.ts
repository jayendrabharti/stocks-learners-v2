/**
 * Auto Square-off Service for MIS Positions
 * Handles automatic closing of MIS positions at market close
 */

import { prisma } from "@/database/client";
import { fetchMarketTiming } from "./marketService";
import { AutoSquareOffStatus, TradeType } from "@/database/generated/enums";
import { fetchLiveData } from "./liveDataService";
import { fetchHistoricalData } from "./historicalDataService";

/**
 * Calculate next market close time
 * @returns Next market close datetime in IST
 */
export const getNextMarketCloseTime = async (): Promise<Date> => {
  try {
    const timingData = await fetchMarketTiming();

    // Get current time in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split("T")[0];

    // Check if today has market timing
    if (today && timingData.dateMarketTimeMap[today]) {
      const todayTiming = timingData.dateMarketTimeMap[today];

      if (todayTiming) {
        // Create today's close time
        const [closeHours, closeMinutes] =
          todayTiming.marketCloseTime.split(":");
        const todayCloseTime = new Date(
          `${today}T${closeHours}:${closeMinutes}:00+05:30`
        );

        // If current time is before today's close, return today's close
        if (now < todayCloseTime) {
          return todayCloseTime;
        }
      }
    }

    // Find next trading day
    const dates = Object.keys(timingData.dateMarketTimeMap).sort();
    const nextDate = dates.find((date) => today && date > today);

    if (nextDate) {
      const nextTiming = timingData.dateMarketTimeMap[nextDate];
      if (!nextTiming?.marketCloseTime) {
        throw new Error("No market close time found for next date");
      }
      const [hours, minutes] = nextTiming.marketCloseTime.split(":");
      return new Date(`${nextDate}T${hours}:${minutes}:00+05:30`);
    }

    // Fallback: Next weekday at 3:15 PM IST
    const tomorrow = new Date(istNow);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Skip weekends
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    const fallbackDate = tomorrow.toISOString().split("T")[0];
    return new Date(`${fallbackDate}T15:15:00+05:30`);
  } catch (error) {
    console.error("Error getting next market close time:", error);

    // Fallback to next weekday 3:15 PM IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const tomorrow = new Date(istNow);
    tomorrow.setDate(tomorrow.getDate() + 1);

    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }

    const fallbackDate = tomorrow.toISOString().split("T")[0];
    return new Date(`${fallbackDate}T15:15:00+05:30`);
  }
};

/**
 * Execute square-off for a MIS position
 * @param positionId Position to square off
 * @param closePrice Price to use for square-off
 */
const executeSquareOff = async (
  positionId: string,
  closePrice: number
): Promise<void> => {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      instrument: true,
      lots: {
        where: { remainingQty: { gt: 0 } },
        orderBy: { createdAt: "asc" },
      },
      user: true,
    },
  });

  if (!position || position.qty <= 0) {
    console.log(`Position ${positionId} not found or already closed`);
    return;
  }

  console.log(
    `Executing auto square-off for position ${positionId}, qty: ${position.qty}, price: ${closePrice}`
  );

  // Execute all operations in a transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Calculate realized P&L for this square-off
    let totalRealizedPnl = 0;
    let remainingQtyToSell = position.qty;

    for (const lot of position.lots) {
      if (remainingQtyToSell <= 0) break;

      const qtyFromThisLot = Math.min(lot.remainingQty, remainingQtyToSell);
      const pnlFromLot = (closePrice - lot.buyPrice) * qtyFromThisLot;
      totalRealizedPnl += pnlFromLot;
      remainingQtyToSell -= qtyFromThisLot;
    }

    // Create sell transaction
    await tx.transaction.create({
      data: {
        userId: position.userId,
        instrumentId: position.instrumentId,
        side: "SELL",
        product: position.product,
        qty: position.qty,
        price: closePrice,
        realizedPnl: totalRealizedPnl,
        positionId: position.id,
        fees: 0,
      },
    });

    // Update lots
    remainingQtyToSell = position.qty;
    for (const lot of position.lots) {
      if (remainingQtyToSell <= 0) break;

      const qtyFromThisLot = Math.min(lot.remainingQty, remainingQtyToSell);

      await tx.positionLot.update({
        where: { id: lot.id },
        data: {
          remainingQty: lot.remainingQty - qtyFromThisLot,
        },
      });

      remainingQtyToSell -= qtyFromThisLot;
    }

    // Update position
    await tx.position.update({
      where: { id: position.id },
      data: {
        qty: 0,
        isOpen: false,
        realizedPnl: position.realizedPnl + totalRealizedPnl,
        autoSquareOffStatus: AutoSquareOffStatus.COMPLETED,
      },
    });

    // Calculate margin to release from original buy prices
    const releasedMargin = position.lots.reduce(
      (sum, lot) => sum + (lot.buyPrice * lot.remainingQty) / position.instrument.leverage,
      0
    );

    // Update user account
    const totalProceeds = closePrice * position.qty;
    await tx.account.update({
      where: { userId: position.userId },
      data: {
        cash: { increment: totalProceeds },
        usedMargin: { decrement: releasedMargin },
      },
    });

    console.log(
      `Auto square-off completed for position ${positionId}. Realized P&L: ${totalRealizedPnl}`
    );
  });
};

/**
 * Process pending auto square-offs
 * Checks for positions that need to be squared off
 */
export const processPendingSquareOffs = async (): Promise<void> => {
  try {
    console.log("Processing pending auto square-offs...");

    const now = new Date();

    // Find all MIS positions that should be squared off (MAIN ACCOUNT)
    const pendingPositions = await prisma.position.findMany({
      where: {
        product: TradeType.MIS,
        isOpen: true,
        qty: { gt: 0 },
        OR: [
          {
            autoSquareOffAt: { lte: now },
            autoSquareOffStatus: AutoSquareOffStatus.PENDING,
          },
          {
            autoSquareOffStatus: AutoSquareOffStatus.FAILED,
            autoSquareOffAt: { lte: now },
            squareOffAttempts: { lt: 5 },
          },
        ],
      },
      include: {
        instrument: true,
        lots: {
          where: { remainingQty: { gt: 0 } },
        },
      },
    });

    // Find all EVENT MIS positions that should be squared off
    const pendingEventPositions = await prisma.eventPosition.findMany({
      where: {
        product: TradeType.MIS,
        isOpen: true,
        qty: { gt: 0 },
        OR: [
          {
            autoSquareOffAt: { lte: now },
            autoSquareOffStatus: AutoSquareOffStatus.PENDING,
          },
          {
            autoSquareOffStatus: AutoSquareOffStatus.FAILED,
            autoSquareOffAt: { lte: now },
            squareOffAttempts: { lt: 5 },
          },
        ],
      },
      include: {
        instrument: true,
        lots: {
          where: { remainingQty: { gt: 0 } },
        },
        eventAccount: true, // Need this for margin update
      },
    });

    console.log(
      `Found ${pendingPositions.length} main positions and ${pendingEventPositions.length} event positions to square off`
    );

    // Process main account positions
    for (const position of pendingPositions) {
      try {
        await prisma.position.update({
          where: { id: position.id },
          data: {
            autoSquareOffStatus: AutoSquareOffStatus.IN_PROGRESS,
            squareOffAttempts: { increment: 1 },
          },
        });

        const closePrice = await determineSquareOffPrice(
          position,
          now
        );

        await executeSquareOff(position.id, closePrice);
      } catch (error: any) {
        console.error(`Error squaring off position ${position.id}:`, error);
        await prisma.position.update({
          where: { id: position.id },
          data: {
            autoSquareOffStatus: AutoSquareOffStatus.FAILED,
            lastSquareOffError: error.message || "Unknown error",
          },
        });
      }
    }

    // Process event account positions
    for (const position of pendingEventPositions) {
      try {
        await prisma.eventPosition.update({
          where: { id: position.id },
          data: {
            autoSquareOffStatus: AutoSquareOffStatus.IN_PROGRESS,
            squareOffAttempts: { increment: 1 },
          },
        });

        const closePrice = await determineSquareOffPrice(
          position,
          now
        );

        await executeEventSquareOff(position, closePrice);
      } catch (error: any) {
        console.error(`Error squaring off event position ${position.id}:`, error);
        await prisma.eventPosition.update({
          where: { id: position.id },
          data: {
            autoSquareOffStatus: AutoSquareOffStatus.FAILED,
            lastSquareOffError: error.message || "Unknown error",
          },
        });
      }
    }

    console.log("Auto square-off processing complete");
  } catch (error) {
    console.error("Error in processPendingSquareOffs:", error);
  }
};

/**
 * Determine the price to use for square-off
 */
async function determineSquareOffPrice(
  position: any,
  now: Date
): Promise<number> {
  const squareOffTime = position.autoSquareOffAt;
  const timeDiff = now.getTime() - (squareOffTime?.getTime() || 0);

  const avgBuyPrice =
    position.lots.reduce((sum: number, lot: any) => sum + lot.buyPrice, 0) /
      position.lots.length || 0;

  if (timeDiff > 5 * 60 * 1000) {
    // More than 5 minutes late - use historical data
    try {
      const historicalResult = await fetchHistoricalData({
        scriptCode: position.instrument.tradingSymbol,
        exchange: position.instrument.exchange,
        segment: position.instrument.segment,
        timeRange: "1D",
      });

      if (
        historicalResult.historicalData?.candles &&
        historicalResult.historicalData.candles.length > 0
      ) {
        const lastCandle =
          historicalResult.historicalData.candles[
            historicalResult.historicalData.candles.length - 1
          ];
        return lastCandle[4]; // close price
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  }

  // Use live price
  try {
    const liveResult = await fetchLiveData({
      scriptCode: position.instrument.tradingSymbol,
      exchange: position.instrument.exchange,
      type: position.instrument.type,
    });
    return liveResult.liveData?.ltp || avgBuyPrice;
  } catch {
    return avgBuyPrice;
  }
}


/**
 * Execute square-off for event position
 */
async function executeEventSquareOff(
  position: any,
  closePrice: number
): Promise<void> {
  console.log(
    `Executing auto square-off for event position ${position.id}, qty: ${position.qty}, price: ${closePrice}`
  );

  await prisma.$transaction(async (tx) => {
    // Calculate realized P&L
    let totalRealizedPnl = 0;
    for (const lot of position.lots) {
      const pnlFromLot = (closePrice - lot.buyPrice) * lot.remainingQty;
      totalRealizedPnl += pnlFromLot;
    }

    // Create transaction
    await tx.eventTransaction.create({
      data: {
        eventAccountId: position.eventAccountId,
        instrumentId: position.instrumentId,
        side: "SELL",
        product: position.product,
        qty: position.qty,
        price: closePrice,
        realizedPnl: totalRealizedPnl,
        positionId: position.id,
        fees: 0,
      },
    });

    // Update lots
    for (const lot of position.lots) {
      await tx.eventPositionLot.update({
        where: { id: lot.id },
        data: { remainingQty: 0 },
      });
    }

    // Update position
    await tx.eventPosition.update({
      where: { id: position.id },
      data: {
        qty: 0,
        isOpen: false,
        realizedPnl: position.realizedPnl + totalRealizedPnl,
        autoSquareOffStatus: AutoSquareOffStatus.COMPLETED,
      },
    });

    // Calculate and release margin
    const releasedMargin = position.lots.reduce(
      (sum: number, lot: any) =>
        sum + (lot.buyPrice * lot.remainingQty) / position.instrument.leverage,
      0
    );

    // Update event account
    const proceeds = closePrice * position.qty;
    await tx.eventAccount.update({
      where: { id: position.eventAccountId },
      data: {
        cash: { increment: proceeds },
        usedMargin: { decrement: releasedMargin },
      },
    });
  });

  console.log(
    `Auto square-off completed for event position ${position.id}`
  );
}

/**
 * Update auto square-off time for a position
 * Called when a MIS position is created
 */
export const setAutoSquareOffTime = async (
  positionId: string,
  isEventPosition: boolean = false
): Promise<void> => {
  try {
    const nextCloseTime = await getNextMarketCloseTime();

    if (isEventPosition) {
      await prisma.eventPosition.update({
        where: { id: positionId },
        data: {
          autoSquareOffAt: nextCloseTime,
          autoSquareOffStatus: AutoSquareOffStatus.PENDING,
        },
      });
    } else {
      await prisma.position.update({
        where: { id: positionId },
        data: {
          autoSquareOffAt: nextCloseTime,
          autoSquareOffStatus: AutoSquareOffStatus.PENDING,
        },
      });
    }

    console.log(
      `Set auto square-off time for ${isEventPosition ? "event " : ""}position ${positionId} to ${nextCloseTime.toISOString()}`
    );
  } catch (error) {
    console.error(
      `Error setting auto square-off time for position ${positionId}:`,
      error
    );
  }
};
