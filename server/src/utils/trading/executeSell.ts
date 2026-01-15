/**
 * SELL Order Execution Engine
 * Handles the complete flow of executing a SELL order with FIFO lot matching
 * Uses Serializable transaction isolation for race condition prevention
 */

import prisma from "@/database/client";
import { Prisma } from "@/database/generated/client";
import type { TradeType } from "@/database/generated/enums";
import { validateOrder, validateSellQuantity } from "./validateOrder";
import { getLivePrice } from "./livePrice";
import { recalculatePositionOnSell } from "./updatePosition";
import { matchLotsForSell, getTotalAvailableQty } from "./fifoMatchLots";
import { fetchInstrumentById } from "@/utils/instruments";
import type { InstrumentModel } from "@/database/generated/models/Instrument";
import { getMarketStatus } from "@/services/marketService";
import { roundCurrency, fromDecimal, toDecimal } from "@/utils/currency";

export type Instrument = InstrumentModel;

export interface SellOrderInput {
  userId: string;
  instrumentId: string;
  qty: number;
  product: TradeType;
  // Note: Limit orders are not currently implemented.
  // All orders execute at market price (LTP).
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

  return roundCurrency(orderValue * feeRate + additionalFee);
}

/**
 * Executes a SELL order with FIFO lot matching
 * @param input - Sell order parameters
 * @returns Sell order execution result
 */
export async function executeSell(
  input: SellOrderInput
): Promise<SellOrderResult> {
  const { userId, instrumentId, qty, product } = input;

  try {
    // Step 0: Check if market is open
    const marketStatus = await getMarketStatus();
    if (!marketStatus.isOpen) {
      const nextOpenMsg = marketStatus.nextOpenTime
        ? ` Market opens at ${new Date(
            marketStatus.nextOpenTime
          ).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`
        : "";
      throw new Error(
        `Market is currently closed.${nextOpenMsg} Orders can only be placed during market hours (9:15 AM - 3:30 PM IST on trading days).`
      );
    }

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

    // Validate price is positive (catches API failures/bad data)
    if (!ltp || ltp <= 0 || !isFinite(ltp)) {
      throw new Error(
        `Invalid market price received for ${instrument.tradingSymbol}. Please try again.`
      );
    }

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

    // Step 4: Calculate fees upfront (doesn't require position data)
    const orderValue = roundCurrency(executedPrice * qty);
    const fees = calculateFees(orderValue, product, instrument.segment);

    // Step 5: Execute the order in a Serializable transaction
    // Position lookup MUST be inside transaction to prevent TOCTOU vulnerability
    const result = await prisma.$transaction(
      async (tx) => {
        // Find position with lock inside transaction
        const position = await tx.position.findFirst({
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

        // Re-validate quantity inside transaction (critical for race condition prevention)
        const availableQty = getTotalAvailableQty(position.lots);
        const qtyValidation = validateSellQuantity(availableQty, qty);

        if (!qtyValidation.valid) {
          throw new Error(
            `Quantity validation failed: ${qtyValidation.errors
              .map((e) => e.message)
              .join(", ")}`
          );
        }

        // Match lots using FIFO
        const fifoResult = matchLotsForSell(position.lots, qty, executedPrice);
        const netRealizedPnL = roundCurrency(
          fifoResult.totalRealizedPnL - fees
        );

        // Create transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            instrumentId,
            positionId: position.id,
            side: "SELL",
            product,
            qty,
            price: toDecimal(executedPrice),
            // limitPrice is not supported - all orders execute at market price
            limitPrice: null,
            realizedPnl: toDecimal(netRealizedPnL),
            fees: toDecimal(fees),
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
          fromDecimal(position.realizedPnl),
          qty,
          netRealizedPnL,
          updatedLots
        );

        // Update position
        await tx.position.update({
          where: { id: position.id },
          data: {
            qty: updatedPosition.qty,
            avgPrice: toDecimal(updatedPosition.avgPrice),
            realizedPnl: toDecimal(updatedPosition.realizedPnl),
            isOpen: updatedPosition.isOpen,
            updatedAt: new Date(),
          },
        });

        // Update account with properly rounded values
        if (product === "MIS") {
          // For MIS, release margin based on original buy prices from lots
          const releasedMargin = roundCurrency(
            fifoResult.consumptions.reduce(
              (sum, consumption) =>
                sum +
                (fromDecimal(consumption.lot.buyPrice) *
                  consumption.consumedQty) /
                  instrument.leverage,
              0
            )
          );
          const proceeds = roundCurrency(orderValue - fees);

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
          const proceeds = roundCurrency(orderValue - fees);

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
          realizedPnL: netRealizedPnL,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000, // 30 seconds
      }
    );

    return {
      success: true,
      transactionId: result.transactionId,
      positionId: result.positionId,
      executedPrice,
      executedQty: qty,
      realizedPnL: result.realizedPnL,
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
