/**
 * Position Update Utilities
 * Handles position state updates and recalculations
 */

import type { PositionLotModel } from "@/database/generated/models/PositionLot";
import { calculateAvgPrice } from "./calculatePnL";

export type PositionLot = PositionLotModel;

export interface PositionUpdateData {
  qty: number;
  avgPrice: number;
  realizedPnl: number;
  isOpen: boolean;
}

/**
 * Recalculates position data after a buy transaction
 * @param currentQty - Current position quantity
 * @param currentAvgPrice - Current average price
 * @param buyQty - Quantity being bought
 * @param buyPrice - Price at which buying
 * @returns Updated position data
 */
export function recalculatePositionOnBuy(
  currentQty: number,
  currentAvgPrice: number,
  buyQty: number,
  buyPrice: number
): Pick<PositionUpdateData, "qty" | "avgPrice"> {
  const newQty = currentQty + buyQty;

  // Calculate new weighted average price
  const totalValue = currentQty * currentAvgPrice + buyQty * buyPrice;
  const newAvgPrice = newQty > 0 ? totalValue / newQty : 0;

  return {
    qty: newQty,
    avgPrice: newAvgPrice,
  };
}

/**
 * Recalculates position data after a sell transaction
 * @param currentQty - Current position quantity
 * @param currentRealizedPnl - Current realized PnL
 * @param sellQty - Quantity being sold
 * @param sellRealizedPnl - Realized PnL from this sell
 * @param lots - Position lots to recalculate average price
 * @returns Updated position data
 */
export function recalculatePositionOnSell(
  currentQty: number,
  currentRealizedPnl: number,
  sellQty: number,
  sellRealizedPnl: number,
  lots: PositionLot[]
): PositionUpdateData {
  const newQty = currentQty - sellQty;
  const newRealizedPnl = currentRealizedPnl + sellRealizedPnl;

  // Recalculate average price from remaining lots
  const newAvgPrice = calculateAvgPrice(lots);

  // Determine if position should be closed
  const isOpen = newQty > 0;

  return {
    qty: newQty,
    avgPrice: newAvgPrice,
    realizedPnl: newRealizedPnl,
    isOpen,
  };
}

/**
 * Checks if a position should be marked as closed
 * @param qty - Current position quantity
 * @returns True if position should be closed
 */
export function shouldClosePosition(qty: number): boolean {
  return qty === 0;
}

/**
 * Creates initial position data for a new position
 * @param buyQty - Initial buy quantity
 * @param buyPrice - Initial buy price
 * @returns Initial position data
 */
export function createInitialPositionData(
  buyQty: number,
  buyPrice: number
): Pick<PositionUpdateData, "qty" | "avgPrice" | "realizedPnl" | "isOpen"> {
  return {
    qty: buyQty,
    avgPrice: buyPrice,
    realizedPnl: 0,
    isOpen: true,
  };
}

/**
 * Validates position state consistency
 * @param qty - Position quantity
 * @param lots - Position lots
 * @throws Error if position state is inconsistent
 */
export function validatePositionConsistency(
  qty: number,
  lots: PositionLot[]
): void {
  const totalLotQty = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);

  if (qty !== totalLotQty) {
    throw new Error(
      `Position quantity (${qty}) does not match total lot quantity (${totalLotQty})`
    );
  }
}

/**
 * Calculates total quantity from lots
 * @param lots - Position lots
 * @returns Total quantity
 */
export function calculateTotalQtyFromLots(lots: PositionLot[]): number {
  return lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
}
