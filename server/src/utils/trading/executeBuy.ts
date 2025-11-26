/**
 * BUY Order Execution Engine
 * Handles the complete flow of executing a BUY order
 */

import prisma from "@/database/client";
import type { TradeType } from "@/database/generated/enums";
import { validateOrder, validateMISMargin } from "./validateOrder";
import { getLivePrice } from "./livePrice";
import {
  recalculatePositionOnBuy,
  createInitialPositionData,
} from "./updatePosition";
import { fetchInstrumentById } from "@/utils/instruments";
import type { InstrumentModel } from "@/database/generated/models/Instrument";
import { setAutoSquareOffTime } from "@/services/autoSquareOffService";
export type Instrument = InstrumentModel;

export interface BuyOrderInput {
  userId: string;
  instrumentId: string;
  qty: number;
  product: TradeType;
  limitPrice?: number;
}

export interface BuyOrderResult {
  success: boolean;
  transactionId: string;
  positionId: string;
  executedPrice: number;
  executedQty: number;
  fees: number;
  message: string;
}

/**
 * Calculates trading fees (simplified)
 * In production, this should include brokerage, STT, exchange fees, GST, etc.
 */
function calculateFees(
  orderValue: number,
  product: TradeType,
  segment: string
): number {
  // Simplified fee calculation
  // CNC: 0.1% of order value
  // MIS: 0.05% of order value
  const feeRate = product === "MIS" ? 0.0005 : 0.001;

  // Additional charges for F&O
  const additionalFee = segment === "FNO" ? 20 : 0;

  return orderValue * feeRate + additionalFee;
}

/**
 * Executes a BUY order
 * @param input - Buy order parameters
 * @returns Buy order execution result
 */
export async function executeBuy(
  input: BuyOrderInput
): Promise<BuyOrderResult> {
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

    // Actual fill price is LTP (limit price is ignored in this implementation)
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

    // Step 4: Calculate order value and fees
    const orderValue = executedPrice * qty;
    const fees = calculateFees(orderValue, product, instrument.segment);
    const totalCost = orderValue + fees;

    // Step 5: Check user account and margin (for MIS)
    const account = await prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new Error("User account not found");
    }

    // For MIS, validate margin and check cash
    if (product === "MIS") {
      const requiredMargin = (executedPrice * qty) / instrument.leverage;
      const totalRequired = requiredMargin + fees;

      if (account.cash < totalRequired) {
        throw new Error(
          `Insufficient funds. Required: ₹${totalRequired.toFixed(
            2
          )} (Margin: ₹${requiredMargin.toFixed(2)} + Fees: ₹${fees.toFixed(
            2
          )}), Available: ₹${account.cash.toFixed(2)}`
        );
      }
    } else {
      // For CNC, check if user has sufficient cash
      if (account.cash < totalCost) {
        throw new Error(
          `Insufficient funds. Required: ${totalCost.toFixed(
            2
          )}, Available: ${account.cash.toFixed(2)}`
        );
      }
    }

    // Step 6: Execute the order in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create position
      let position = await tx.position.findFirst({
        where: {
          userId,
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
        // Create new position
        const initialData = createInitialPositionData(qty, executedPrice);
        position = await tx.position.create({
          data: {
            userId,
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
      const transaction = await tx.transaction.create({
        data: {
          userId,
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
      await tx.positionLot.create({
        data: {
          positionId: position.id,
          buyTransactionId: transaction.id,
          totalQty: qty,
          remainingQty: qty,
          buyPrice: executedPrice,
        },
      });

      // Update position (if not new)
      if (!isNewPosition) {
        const updatedPosition = recalculatePositionOnBuy(
          position.qty,
          position.avgPrice,
          qty,
          executedPrice
        );

        await tx.position.update({
          where: { id: position.id },
          data: {
            qty: updatedPosition.qty,
            avgPrice: updatedPosition.avgPrice,
            updatedAt: new Date(),
          },
        });
      }

      // Update account
      if (product === "MIS") {
        // For MIS, deduct margin + fees from cash and increase used margin
        const requiredMargin = (executedPrice * qty) / instrument.leverage;
        const totalDeduction = requiredMargin + fees;

        await tx.account.update({
          where: { userId },
          data: {
            cash: { decrement: totalDeduction },
            usedMargin: { increment: requiredMargin },
            updatedAt: new Date(),
          },
        });
      } else {
        // For CNC, deduct cash
        await tx.account.update({
          where: { userId },
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

    // Set auto square-off time for MIS positions (async, non-blocking)
    if (product === "MIS") {
      setAutoSquareOffTime(result.positionId).catch((error) => {
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
      message: "BUY order executed successfully",
    };
  } catch (error) {
    console.error("BUY execution error:", error);
    throw new Error(
      `Failed to execute BUY order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
