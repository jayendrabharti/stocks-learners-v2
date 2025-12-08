/**
 * Event Trading - Buy Order Execution
 * Wrapper around main trading logic for event-specific accounts
 */

import type { TradeType } from "@/database/generated/enums.js";
import prisma from "@/database/client.js";

export interface EventBuyOrderInput {
  eventAccountId: string;
  instrumentId: string;
  qty: number;
  product: TradeType;
  limitPrice?: number | undefined;
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
  const { eventAccountId, instrumentId, qty, product, limitPrice } = input;

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



    // Use the main executeBuy logic but with event-specific context
    // Note: The main logic needs to be adapted to work with event accounts
    // For now, we'll implement event-specific logic here

    const result = await executeEventBuyInternal({
      eventAccountId,
      instrumentId,
      qty,
      product,
      limitPrice: limitPrice || undefined,
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
  const {
    recalculatePositionOnBuy,
    createInitialPositionData,
  } = await import("../updatePosition.js");
  const { setAutoSquareOffTime } = await import(
    "@/services/autoSquareOffService.js"
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
  const executedPrice = ltp;

  // Step 3: Validate order
  const validation = validateOrder(instrument, "BUY", qty, executedPrice, product);
  if (!validation.valid) {
    throw new Error(
      `Order validation failed: ${validation.errors.map((e) => e.message).join(", ")}`
    );
  }

  // Step 4: Calculate fees
  const orderValue = executedPrice * qty;
  const feeRate = product === "MIS" ? 0.0005 : 0.001;
  const additionalFee = instrument.segment === "FNO" ? 20 : 0;
  const fees = orderValue * feeRate + additionalFee;
  const totalCost = orderValue + fees;

  // Step 5: Check event account balance
  const eventAccount = await prisma.eventAccount.findUnique({
    where: { id: eventAccountId },
  });

  if (!eventAccount) {
    throw new Error("Event account not found");
  }

  // For MIS, validate margin
  if (product === "MIS") {
    const requiredMargin = (executedPrice * qty) / instrument.leverage;
    const totalRequired = requiredMargin + fees;

    if (eventAccount.cash < totalRequired) {
      throw new Error(
        `Insufficient funds. Required: ₹${totalRequired.toFixed(2)}, Available: ₹${eventAccount.cash.toFixed(2)}`
      );
    }
  } else {
    // For CNC, check full amount
    if (eventAccount.cash < totalCost) {
      throw new Error(
        `Insufficient funds. Required: ${totalCost.toFixed(2)}, Available: ${eventAccount.cash.toFixed(2)}`
      );
    }
  }

  // Step 6: Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
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
        limitPrice: limitPrice || null,
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
        position.avgPrice,
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
  });

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
