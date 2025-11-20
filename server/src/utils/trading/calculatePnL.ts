/**
 * PnL Calculation Utilities
 * Handles realized and unrealized profit/loss calculations
 */

import { PositionLot } from "@/database/generated/client";

/**
 * Calculates realized PnL for a lot consumption
 * @param buyPrice - The price at which the lot was bought
 * @param sellPrice - The price at which the lot is being sold
 * @param qty - The quantity being sold from this lot
 * @returns The realized PnL
 */
export function calculateRealizedPnL(
  buyPrice: number,
  sellPrice: number,
  qty: number
): number {
  return (sellPrice - buyPrice) * qty;
}

/**
 * Calculates unrealized PnL for a lot
 * @param lot - The position lot
 * @param currentLTP - The current Last Traded Price
 * @returns The unrealized PnL
 */
export function calculateUnrealizedPnL(
  lot: PositionLot,
  currentLTP: number
): number {
  return (currentLTP - lot.buyPrice) * lot.remainingQty;
}

/**
 * Calculates total unrealized PnL for multiple lots
 * @param lots - Array of position lots
 * @param currentLTP - The current Last Traded Price
 * @returns The total unrealized PnL
 */
export function calculateTotalUnrealizedPnL(
  lots: PositionLot[],
  currentLTP: number
): number {
  return lots.reduce((total, lot) => {
    return total + calculateUnrealizedPnL(lot, currentLTP);
  }, 0);
}

/**
 * Calculates the weighted average price from remaining lots
 * @param lots - Array of position lots
 * @returns The weighted average buy price
 */
export function calculateAvgPrice(lots: PositionLot[]): number {
  let totalQty = 0;
  let totalValue = 0;

  for (const lot of lots) {
    if (lot.remainingQty > 0) {
      totalQty += lot.remainingQty;
      totalValue += lot.buyPrice * lot.remainingQty;
    }
  }

  if (totalQty === 0) return 0;
  return totalValue / totalQty;
}

/**
 * Calculates position-level metrics
 * @param lots - Array of position lots
 * @param currentLTP - The current Last Traded Price
 * @param realizedPnL - Already realized PnL from past trades
 * @returns Complete position metrics
 */
export function calculatePositionMetrics(
  lots: PositionLot[],
  currentLTP: number,
  realizedPnL: number
) {
  const totalQty = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
  const avgPrice = calculateAvgPrice(lots);
  const unrealizedPnL = calculateTotalUnrealizedPnL(lots, currentLTP);
  const totalPnL = realizedPnL + unrealizedPnL;
  const investedValue = avgPrice * totalQty;
  const currentValue = currentLTP * totalQty;

  return {
    totalQty,
    avgPrice,
    unrealizedPnL,
    realizedPnL,
    totalPnL,
    investedValue,
    currentValue,
    pnlPercentage: investedValue > 0 ? (totalPnL / investedValue) * 100 : 0,
  };
}

/**
 * Calculates the return on investment (ROI) percentage
 * @param investedValue - Total amount invested
 * @param currentValue - Current value of the position
 * @returns ROI percentage
 */
export function calculateROI(
  investedValue: number,
  currentValue: number
): number {
  if (investedValue === 0) return 0;
  return ((currentValue - investedValue) / investedValue) * 100;
}

/**
 * Calculates breakeven price for a position
 * @param avgBuyPrice - Average buy price
 * @param fees - Total fees incurred
 * @param qty - Total quantity
 * @returns Breakeven price
 */
export function calculateBreakeven(
  avgBuyPrice: number,
  fees: number,
  qty: number
): number {
  if (qty === 0) return 0;
  return avgBuyPrice + fees / qty;
}
