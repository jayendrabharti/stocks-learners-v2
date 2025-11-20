/**
 * FIFO Lot Matching Utilities
 * Handles First-In-First-Out lot consumption during SELL operations
 */

import { PositionLot } from "@/database/generated/client";
import { calculateRealizedPnL } from "./calculatePnL";

export interface LotConsumption {
  lot: PositionLot;
  consumedQty: number;
  remainingQty: number;
  realizedPnL: number;
}

export interface FIFOMatchResult {
  consumptions: LotConsumption[];
  totalRealizedPnL: number;
  totalConsumedQty: number;
}

/**
 * Matches a SELL order against position lots using FIFO
 * @param lots - Array of position lots (should be sorted by createdAt ASC)
 * @param sellQty - Quantity to sell
 * @param sellPrice - Price at which selling
 * @returns FIFO match result with lot consumptions and PnL
 */
export function matchLotsForSell(
  lots: PositionLot[],
  sellQty: number,
  sellPrice: number
): FIFOMatchResult {
  const consumptions: LotConsumption[] = [];
  let remainingSellQty = sellQty;
  let totalRealizedPnL = 0;
  let totalConsumedQty = 0;

  // Sort lots by creation time to ensure FIFO
  const sortedLots = [...lots].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const lot of sortedLots) {
    if (remainingSellQty <= 0) break;
    if (lot.remainingQty <= 0) continue;

    // Determine how much to consume from this lot
    const consumedQty = Math.min(lot.remainingQty, remainingSellQty);
    const newRemainingQty = lot.remainingQty - consumedQty;

    // Calculate realized PnL for this consumption
    const realizedPnL = calculateRealizedPnL(
      lot.buyPrice,
      sellPrice,
      consumedQty
    );

    consumptions.push({
      lot,
      consumedQty,
      remainingQty: newRemainingQty,
      realizedPnL,
    });

    totalRealizedPnL += realizedPnL;
    totalConsumedQty += consumedQty;
    remainingSellQty -= consumedQty;
  }

  // Validate that we consumed the full sell quantity
  if (remainingSellQty > 0) {
    throw new Error(
      `Insufficient quantity in lots. Remaining: ${remainingSellQty}`
    );
  }

  return {
    consumptions,
    totalRealizedPnL,
    totalConsumedQty,
  };
}

/**
 * Validates that lots have sufficient quantity for a sell order
 * @param lots - Array of position lots
 * @param sellQty - Quantity to sell
 * @returns True if sufficient quantity exists
 */
export function hassufficientQuantity(
  lots: PositionLot[],
  sellQty: number
): boolean {
  const totalAvailableQty = lots.reduce(
    (sum, lot) => sum + lot.remainingQty,
    0
  );
  return totalAvailableQty >= sellQty;
}

/**
 * Gets the total available quantity across all lots
 * @param lots - Array of position lots
 * @returns Total available quantity
 */
export function getTotalAvailableQty(lots: PositionLot[]): number {
  return lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
}

/**
 * Prepares lot update operations for database transaction
 * @param consumptions - Array of lot consumptions
 * @returns Array of update operations
 */
export function prepareLotUpdates(consumptions: LotConsumption[]) {
  return consumptions.map((consumption) => ({
    where: { id: consumption.lot.id },
    data: {
      remainingQty: consumption.remainingQty,
      updatedAt: new Date(),
    },
  }));
}
