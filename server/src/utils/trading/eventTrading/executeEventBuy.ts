/**
 * Event Trading - Buy Order Execution
 * Wrapper around main trading logic for event-specific accounts
 */

import type { TradeType } from "@/database/generated/enums.js";
import prisma from "@/database/client.js";
import { Prisma } from "@/database/generated/client";
import { fromDecimal, roundCurrency } from "@/utils/currency";

export interface EventBuyOrderInput {
  eventAccountId: string;
  instrumentId: string;
  qty: number;
  product: TradeType;
  // Note: limitPrice is not supported - all orders execute at market price
}

export interface EventBuyOrderResult {
  success: boolean;
  transactionId: string;
  positionId: string;
  executedPrice: number;
  executedQty: number;
  fees: number;
  message: string;
}

/**
 * Execute BUY order for event account
 * This is a wrapper that adapts the main trading logic for event accounts
 */
export async function executeEventBuy(
  input: EventBuyOrderInput
): Promise<EventBuyOrderResult> {
  const { eventAccountId, instrumentId, qty, product } = input;

  try {
    // Get event account to verify it exists
    const eventAccount = await prisma.eventAccount.findUnique({
      where: { id: eventAccountId },
      include: {
        registration: {
          include: {
            user: true,
            event: true,
          },
        },
      },
    });

    if (!eventAccount) {
      throw new Error("Event account not found");
    }

    // Validate event timeframe
    const now = new Date();
    const event = eventAccount.registration.event;

    if (now < event.eventStartAt) {
      throw new Error("Event trading has not started yet");
    }

    if (now > event.eventEndAt) {
      throw new Error("Event trading has ended");
    }

    if (!event.isActive) {
      throw new Error("Event is not active");
    }

    const result = await executeEventBuyInternal({
      eventAccountId,
      instrumentId,
      qty,
      product,
    });

    return result;
  } catch (error: any) {
    console.error("Event BUY execution error:", error);
    throw new Error(
      `Failed to execute event BUY order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Internal event buy execution
 * This implements the same logic as main trading but for event accounts
 */
async function executeEventBuyInternal(
  input: EventBuyOrderInput
): Promise<EventBuyOrderResult> {
  // Import dependencies
  const { fetchInstrumentById } = await import("@/utils/instruments/index.js");
  const { getLivePrice } = await import("../livePrice.js");
  const { validateOrder } = await import("../validateOrder.js");
  const { recalculatePositionOnBuy, createInitialPositionData } = await import(
    "../updatePosition.js"
  );
  const { setAutoSquareOffTime } = await import(
    "@/services/autoSquareOffService.js"
  );

  const { eventAccountId, instrumentId, qty, product } = input;

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
    "BUY",
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

  // Step 4: Calculate fees with proper rounding
  const orderValue = roundCurrency(executedPrice * qty);
  const feeRate = product === "MIS" ? 0.0005 : 0.001;
  const additionalFee = instrument.segment === "FNO" ? 20 : 0;
  const fees = roundCurrency(orderValue * feeRate + additionalFee);
  const totalCost = roundCurrency(orderValue + fees);

  // Step 5: Check event account balance
  const eventAccount = await prisma.eventAccount.findUnique({
    where: { id: eventAccountId },
  });

  if (!eventAccount) {
    throw new Error("Event account not found");
  }

  // Validate leverage is positive
  if (product === "MIS" && instrument.leverage <= 0) {
    throw new Error("Invalid instrument leverage configuration");
  }

  // Step 5 & 6: Execute in Serializable transaction with atomic balance check
  const result = await prisma.$transaction(
    async (tx) => {
      // Re-fetch account inside transaction for atomic balance check
      const eventAccount = await tx.eventAccount.findUnique({
        where: { id: eventAccountId },
      });

      if (!eventAccount) {
        throw new Error("Event account not found");
      }

      const accountCash = fromDecimal(eventAccount.cash);

      // Validate sufficient funds inside transaction
      if (product === "MIS") {
        const requiredMargin = roundCurrency(
          (executedPrice * qty) / instrument.leverage
        );
        const totalRequired = roundCurrency(requiredMargin + fees);

        if (accountCash < totalRequired) {
          throw new Error(
            `Insufficient funds. Required: ₹${totalRequired.toFixed(
              2
            )}, Available: ₹${accountCash.toFixed(2)}`
          );
        }
      } else {
        if (accountCash < totalCost) {
          throw new Error(
            `Insufficient funds. Required: ${totalCost.toFixed(
              2
            )}, Available: ${accountCash.toFixed(2)}`
          );
        }
      }

      // Find or create event position
      let position = await tx.eventPosition.findFirst({
        where: {
          eventAccountId,
          instrumentId,
          product,
          isOpen: true,
        },
        include: {
          lots: true,
        },
      });

      let isNewPosition = false;

      if (!position) {
        const initialData = createInitialPositionData(qty, executedPrice);
        position = await tx.eventPosition.create({
          data: {
            eventAccountId,
            instrumentId,
            product,
            ...initialData,
          },
          include: {
            lots: true,
          },
        });
        isNewPosition = true;
      }

      // Create transaction record
      const transaction = await tx.eventTransaction.create({
        data: {
          eventAccountId,
          instrumentId,
          positionId: position.id,
          side: "BUY",
          product,
          qty,
          price: executedPrice,
          limitPrice: null, // Limit orders not supported
          fees,
        },
      });

      // Create position lot
      await tx.eventPositionLot.create({
        data: {
          positionId: position.id,
          buyTransactionId: transaction.id,
          totalQty: qty,
          remainingQty: qty,
          buyPrice: executedPrice,
        },
      });

      // Update position if not new
      if (!isNewPosition) {
        const updatedPosition = recalculatePositionOnBuy(
          position.qty,
          fromDecimal(position.avgPrice),
          qty,
          executedPrice
        );

        await tx.eventPosition.update({
          where: { id: position.id },
          data: {
            qty: updatedPosition.qty,
            avgPrice: updatedPosition.avgPrice,
            updatedAt: new Date(),
          },
        });
      }

      // Update event account
      if (product === "MIS") {
        const requiredMargin = (executedPrice * qty) / instrument.leverage;
        const totalDeduction = requiredMargin + fees;

        await tx.eventAccount.update({
          where: { id: eventAccountId },
          data: {
            cash: { decrement: totalDeduction },
            usedMargin: { increment: requiredMargin },
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.eventAccount.update({
          where: { id: eventAccountId },
          data: {
            cash: { decrement: totalCost },
            updatedAt: new Date(),
          },
        });
      }

      return {
        transactionId: transaction.id,
        positionId: position.id,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    }
  );

  // Set auto square-off for MIS
  if (product === "MIS") {
    setAutoSquareOffTime(result.positionId, true).catch((error) => {
      console.error("Error setting auto square-off time:", error);
    });
  }

  return {
    success: true,
    transactionId: result.transactionId,
    positionId: result.positionId,
    executedPrice,
    executedQty: qty,
    fees,
    message: "Event BUY order executed successfully",
  };
}
