/**
 * PnL Calculation Utilities
 * Handles realized and unrealized profit/loss calculations
 * Uses precision-safe arithmetic to prevent floating-point errors
 */

import { PositionLot } from "@/database/generated/client";
import { Prisma } from "@/database/generated/client";
import { roundCurrency, fromDecimal } from "@/utils/currency";

type DecimalLike = Prisma.Decimal | number;

/**
 * Safely converts a value to number (handles both Decimal and number)
 */
function toNumber(value: DecimalLike): number {
  if (typeof value === "number") return value;
  return fromDecimal(value);
}

/**
 * Calculates realized PnL for a lot consumption
 * @param buyPrice - The price at which the lot was bought
 * @param sellPrice - The price at which the lot is being sold
 * @param qty - The quantity being sold from this lot
 * @returns The realized PnL (rounded to 4 decimal places)
 */
export function calculateRealizedPnL(
  buyPrice: DecimalLike,
  sellPrice: DecimalLike,
  qty: number
): number {
  const buy = toNumber(buyPrice);
  const sell = toNumber(sellPrice);
  return roundCurrency((sell - buy) * qty);
}

/**
 * Calculates unrealized PnL for a lot
 * @param lot - The position lot
 * @param currentLTP - The current Last Traded Price
 * @returns The unrealized PnL (rounded to 4 decimal places)
 */
export function calculateUnrealizedPnL(
  lot: PositionLot,
  currentLTP: number
): number {
  const buyPrice = toNumber(lot.buyPrice);
  return roundCurrency((currentLTP - buyPrice) * lot.remainingQty);
}

/**
 * Calculates total unrealized PnL for multiple lots
 * @param lots - Array of position lots
 * @param currentLTP - The current Last Traded Price
 * @returns The total unrealized PnL (rounded to 4 decimal places)
 */
export function calculateTotalUnrealizedPnL(
  lots: PositionLot[],
  currentLTP: number
): number {
  const total = lots.reduce((total, lot) => {
    return total + calculateUnrealizedPnL(lot, currentLTP);
  }, 0);
  return roundCurrency(total);
}

/**
 * Calculates the weighted average price from remaining lots
 * @param lots - Array of position lots
 * @returns The weighted average buy price (rounded to 4 decimal places)
 */
export function calculateAvgPrice(lots: PositionLot[]): number {
  let totalQty = 0;
  let totalValue = 0;

  for (const lot of lots) {
    if (lot.remainingQty > 0) {
      const buyPrice = toNumber(lot.buyPrice);
      totalQty += lot.remainingQty;
      totalValue += buyPrice * lot.remainingQty;
    }
  }

  if (totalQty === 0) return 0;
  return roundCurrency(totalValue / totalQty);
}

/**
 * Calculates position-level metrics
 * @param lots - Array of position lots
 * @param currentLTP - The current Last Traded Price
 * @param realizedPnL - Already realized PnL from past trades
 * @returns Complete position metrics with precision-safe values
 */
export function calculatePositionMetrics(
  lots: PositionLot[],
  currentLTP: number,
  realizedPnL: DecimalLike
) {
  const totalQty = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
  const avgPrice = calculateAvgPrice(lots);
  const unrealizedPnL = calculateTotalUnrealizedPnL(lots, currentLTP);
  const realized = toNumber(realizedPnL);
  const totalPnL = roundCurrency(realized + unrealizedPnL);
  const investedValue = roundCurrency(avgPrice * totalQty);
  const currentValue = roundCurrency(currentLTP * totalQty);

  return {
    totalQty,
    avgPrice,
    unrealizedPnL,
    realizedPnL: realized,
    totalPnL,
    investedValue,
    currentValue,
    pnlPercentage:
      investedValue > 0 ? roundCurrency((totalPnL / investedValue) * 100) : 0,
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
