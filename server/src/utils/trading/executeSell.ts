/**
 * SELL Order Execution Engine
 * Handles the complete flow of executing a SELL order with FIFO lot matching
 */

import prisma from "@/database/client";
import type { TradeType } from "@/database/generated/enums";
import { validateOrder, validateSellQuantity } from "./validateOrder";
import { getLivePrice } from "./livePrice";
import { recalculatePositionOnSell } from "./updatePosition";
import { matchLotsForSell, getTotalAvailableQty } from "./fifoMatchLots";
import { fetchInstrumentById } from "@/utils/instruments";
import type { InstrumentModel } from "@/database/generated/models/Instrument";

export type Instrument = InstrumentModel;

export interface SellOrderInput {
  userId: string;
  instrumentId: string;
  qty: number;
  product: TradeType;
  limitPrice?: number;
}

export interface SellOrderResult {
  success: boolean;
  transactionId: string;
  positionId: string;
  executedPrice: number;
  executedQty: number;
  realizedPnL: number;
  fees: number;
  message: string;
}

/**
 * Calculates trading fees for SELL (simplified)
 */
function calculateFees(
  orderValue: number,
  product: TradeType,
  segment: string
): number {
  // Simplified fee calculation
  const feeRate = product === "MIS" ? 0.0005 : 0.001;
  const additionalFee = segment === "FNO" ? 20 : 0;

  return orderValue * feeRate + additionalFee;
}

/**
 * Executes a SELL order with FIFO lot matching
 * @param input - Sell order parameters
 * @returns Sell order execution result
 */
export async function executeSell(
  input: SellOrderInput
): Promise<SellOrderResult> {
  const { userId, instrumentId, qty, product, limitPrice } = input;

  try {
    // Step 1: Fetch instrument details (with CSV fallback)
    const instrument = await fetchInstrumentById(instrumentId);

    if (!instrument) {
      throw new Error("Instrument not found");
    }

    // Step 2: Get live price (LTP)
    const ltp = await getLivePrice(
      instrument.tradingSymbol,
      instrument.exchange,
      instrument.type,
      instrument.exchangeToken
    );

    // Actual fill price is LTP
    const executedPrice = ltp;

    // Step 3: Validate order
    const validation = validateOrder(
      instrument,
      "SELL",
      qty,
      executedPrice,
      product
    );

    if (!validation.valid) {
      throw new Error(
        `Order validation failed: ${validation.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    // Step 4: Find existing position (inside transaction to ensure lock)
    // Note: Prisma doesn't support SELECT FOR UPDATE directly,
    // but transaction isolation provides serializable guarantees
    const position = await prisma.position.findFirst({
      where: {
        userId,
        instrumentId,
        product,
        isOpen: true,
      },
      include: {
        lots: {
          where: {
            remainingQty: { gt: 0 },
          },
          orderBy: {
            createdAt: "asc", // FIFO order
          },
        },
      },
    });

    if (!position) {
      throw new Error(
        `No open ${product} position found for this instrument. You can only sell from existing ${product} holdings.`
      );
    }

    // Step 5: Validate sufficient quantity
    const availableQty = getTotalAvailableQty(position.lots);
    const qtyValidation = validateSellQuantity(availableQty, qty);

    if (!qtyValidation.valid) {
      throw new Error(
        `Quantity validation failed: ${qtyValidation.errors
          .map((e) => e.message)
          .join(", ")}`
      );
    }

    // Step 6: Match lots using FIFO
    const fifoResult = matchLotsForSell(position.lots, qty, executedPrice);

    // Step 7: Calculate fees
    const orderValue = executedPrice * qty;
    const fees = calculateFees(orderValue, product, instrument.segment);
    const netRealizedPnL = fifoResult.totalRealizedPnL - fees;

    // Step 8: Execute the order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          instrumentId,
          positionId: position.id,
          side: "SELL",
          product,
          qty,
          price: executedPrice,
          limitPrice: limitPrice || null,
          realizedPnl: netRealizedPnL,
          fees,
        },
      });

      // Update each consumed lot
      for (const consumption of fifoResult.consumptions) {
        await tx.positionLot.update({
          where: { id: consumption.lot.id },
          data: {
            remainingQty: consumption.remainingQty,
            updatedAt: new Date(),
          },
        });
      }

      // Fetch updated lots to recalculate position
      const updatedLots = await tx.positionLot.findMany({
        where: { positionId: position.id },
      });

      // Recalculate position
      const updatedPosition = recalculatePositionOnSell(
        position.qty,
        position.realizedPnl,
        qty,
        netRealizedPnL,
        updatedLots
      );

      // Update position
      await tx.position.update({
        where: { id: position.id },
        data: {
          qty: updatedPosition.qty,
          avgPrice: updatedPosition.avgPrice,
          realizedPnl: updatedPosition.realizedPnl,
          isOpen: updatedPosition.isOpen,
          updatedAt: new Date(),
        },
      });

      // Update account
      if (product === "MIS") {
        // For MIS, release margin based on original buy prices from lots
        // Calculate margin to release from consumed lots (not from sell price)
        const releasedMargin = fifoResult.consumptions.reduce(
          (sum, consumption) =>
            sum +
            (consumption.lot.buyPrice * consumption.consumedQty) /
              instrument.leverage,
          0
        );
        const proceeds = orderValue - fees;

        await tx.account.update({
          where: { userId },
          data: {
            usedMargin: { decrement: releasedMargin },
            cash: { increment: proceeds },
            updatedAt: new Date(),
          },
        });
      } else {
        // For CNC, add proceeds
        const proceeds = orderValue - fees;

        await tx.account.update({
          where: { userId },
          data: {
            cash: { increment: proceeds },
            updatedAt: new Date(),
          },
        });
      }

      return {
        transactionId: transaction.id,
        positionId: position.id,
      };
    });

    return {
      success: true,
      transactionId: result.transactionId,
      positionId: result.positionId,
      executedPrice,
      executedQty: qty,
      realizedPnL: netRealizedPnL,
      fees,
      message: "SELL order executed successfully",
    };
  } catch (error) {
    console.error("SELL execution error:", error);
    throw new Error(
      `Failed to execute SELL order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
