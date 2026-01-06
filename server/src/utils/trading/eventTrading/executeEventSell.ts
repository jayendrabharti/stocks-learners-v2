/**
 * Event Trading - Sell Order Execution
 * Wrapper around main trading logic for event-specific accounts
 */

import type { TradeType } from "@/database/generated/enums.js";
import prisma from "@/database/client.js";
import { Prisma } from "@/database/generated/client";
import { fromDecimal, roundCurrency } from "@/utils/currency";

export interface EventSellOrderInput {
  eventAccountId: string;
  instrumentId: string;
  qty: number;
  product: TradeType;
  limitPrice?: number | undefined;
}

export interface EventSellOrderResult {
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
 * Execute SELL order for event account
 */
export async function executeEventSell(
  input: EventSellOrderInput
): Promise<EventSellOrderResult> {
  const { eventAccountId, instrumentId, qty, product, limitPrice } = input;

  try {
    // Get event account
    const eventAccount = await prisma.eventAccount.findUnique({
      where: { id: eventAccountId },
      include: {
        registration: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!eventAccount) {
      throw new Error("Event account not found");
    }

    // Check if event is active
    const now = new Date();
    const event = eventAccount.registration.event;

    if (now < event.eventStartAt) {
      throw new Error("Event has not started yet");
    }

    if (now > event.eventEndAt) {
      throw new Error("Event has ended");
    }

    const result = await executeEventSellInternal({
      eventAccountId,
      instrumentId,
      qty,
      product,
      limitPrice,
    });

    return result;
  } catch (error) {
    console.error("Event SELL execution error:", error);
    throw new Error(
      `Failed to execute event SELL order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Internal event sell execution
 */
async function executeEventSellInternal(
  input: EventSellOrderInput
): Promise<EventSellOrderResult> {
  // Import dependencies
  const { fetchInstrumentById } = await import("@/utils/instruments/index.js");
  const { getLivePrice } = await import("../livePrice.js");
  const { validateOrder, validateSellQuantity } = await import(
    "../validateOrder.js"
  );
  const { recalculatePositionOnSell } = await import("../updatePosition.js");
  const { matchLotsForSell, getTotalAvailableQty } = await import(
    "../fifoMatchLots.js"
  );

  const { eventAccountId, instrumentId, qty, product, limitPrice } = input;

  // Step 1: Fetch instrument
  const instrument = await fetchInstrumentById(instrumentId);
  if (!instrument) {
    throw new Error("Instrument not found");
  }

  // Step 2: Get live price
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

  // Step 4: Calculate fees upfront
  const orderValue = roundCurrency(executedPrice * qty);
  const feeRate = product === "MIS" ? 0.0005 : 0.001;
  const additionalFee = instrument.segment === "FNO" ? 20 : 0;
  const fees = roundCurrency(orderValue * feeRate + additionalFee);

  // Step 5: Execute in Serializable transaction
  // Position lookup MUST be inside transaction to prevent TOCTOU
  const result = await prisma.$transaction(
    async (tx) => {
      // Find position inside transaction
      const position = await tx.eventPosition.findFirst({
        where: {
          eventAccountId,
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
              createdAt: "asc", // FIFO
            },
          },
        },
      });

      if (!position) {
        throw new Error(
          `No open ${product} position found for this instrument in event account`
        );
      }

      // Validate sufficient quantity inside transaction
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
      const netRealizedPnL = roundCurrency(fifoResult.totalRealizedPnL - fees);

      // Create transaction record
      const transaction = await tx.eventTransaction.create({
        data: {
          eventAccountId,
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
        await tx.eventPositionLot.update({
          where: { id: consumption.lot.id },
          data: {
            remainingQty: consumption.remainingQty,
            updatedAt: new Date(),
          },
        });
      }

      // Fetch updated lots
      const updatedLots = await tx.eventPositionLot.findMany({
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
      await tx.eventPosition.update({
        where: { id: position.id },
        data: {
          qty: updatedPosition.qty,
          avgPrice: updatedPosition.avgPrice,
          realizedPnl: updatedPosition.realizedPnl,
          isOpen: updatedPosition.isOpen,
          updatedAt: new Date(),
        },
      });

      // Update event account
      if (product === "MIS") {
        // For MIS, release margin based on original buy prices from lots
        const releasedMargin = fifoResult.consumptions.reduce(
          (sum, consumption) =>
            sum +
            (fromDecimal(consumption.lot.buyPrice) * consumption.consumedQty) /
              instrument.leverage,
          0
        );
        const proceeds = orderValue - fees;

        await tx.eventAccount.update({
          where: { id: eventAccountId },
          data: {
            usedMargin: { decrement: releasedMargin },
            cash: { increment: proceeds },
            updatedAt: new Date(),
          },
        });
      } else {
        const proceeds = orderValue - fees;

        await tx.eventAccount.update({
          where: { id: eventAccountId },
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
      timeout: 30000,
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
    message: "Event SELL order executed successfully",
  };
}
