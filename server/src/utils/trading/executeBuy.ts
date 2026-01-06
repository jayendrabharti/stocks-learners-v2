/**
 * BUY Order Execution Engine
 * Handles the complete flow of executing a BUY order
 * Uses Serializable transaction isolation for race condition prevention
 */

import prisma from "@/database/client";
import { Prisma } from "@/database/generated/client";
import type { TradeType } from "@/database/generated/enums";
import { validateOrder } from "./validateOrder";
import { getLivePrice } from "./livePrice";
import {
  recalculatePositionOnBuy,
  createInitialPositionData,
} from "./updatePosition";
import { fetchInstrumentById } from "@/utils/instruments";
import type { InstrumentModel } from "@/database/generated/models/Instrument";
import { getNextMarketCloseTime } from "@/services/autoSquareOffService";
import { roundCurrency, fromDecimal, toDecimal } from "@/utils/currency";
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

  return roundCurrency(orderValue * feeRate + additionalFee);
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

    // Validate price is positive (catches API failures/bad data)
    if (!ltp || ltp <= 0 || !isFinite(ltp)) {
      throw new Error(
        `Invalid market price received for ${instrument.tradingSymbol}. Please try again.`
      );
    }

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
    const orderValue = roundCurrency(executedPrice * qty);
    const fees = calculateFees(orderValue, product, instrument.segment);
    const totalCost = roundCurrency(orderValue + fees);

    // Validate leverage is positive (prevent division by zero)
    if (product === "MIS" && instrument.leverage <= 0) {
      throw new Error("Invalid instrument leverage configuration");
    }

    // Step 5: Execute the order in a Serializable transaction
    // Balance check MUST be inside transaction to prevent race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        // Re-fetch account inside transaction for atomic balance check
        const account = await tx.account.findUnique({
          where: { userId },
        });

        if (!account) {
          throw new Error("User account not found");
        }

        const accountCash = fromDecimal(account.cash);

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
              )} (Margin: ₹${requiredMargin.toFixed(2)} + Fees: ₹${fees.toFixed(
                2
              )}), Available: ₹${accountCash.toFixed(2)}`
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

        // Find or create position with lock to prevent race conditions
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

        // For MIS, get auto square-off time upfront (inside transaction)
        let autoSquareOffAt: Date | null = null;
        if (product === "MIS") {
          autoSquareOffAt = await getNextMarketCloseTime();
        }

        if (!position) {
          // Create new position with auto square-off time if MIS
          const initialData = createInitialPositionData(qty, executedPrice);
          position = await tx.position.create({
            data: {
              userId,
              instrumentId,
              product,
              ...initialData,
              autoSquareOffAt: autoSquareOffAt,
              autoSquareOffStatus: product === "MIS" ? "PENDING" : undefined,
            },
            include: {
              lots: true,
            },
          });
          isNewPosition = true;
        } else if (product === "MIS" && autoSquareOffAt) {
          // Update auto square-off time for existing MIS position
          await tx.position.update({
            where: { id: position.id },
            data: {
              autoSquareOffAt: autoSquareOffAt,
              autoSquareOffStatus: "PENDING",
            },
          });
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
            price: toDecimal(executedPrice),
            limitPrice: limitPrice ? toDecimal(limitPrice) : null,
            fees: toDecimal(fees),
          },
        });

        // Create position lot
        await tx.positionLot.create({
          data: {
            positionId: position.id,
            buyTransactionId: transaction.id,
            totalQty: qty,
            remainingQty: qty,
            buyPrice: toDecimal(executedPrice),
          },
        });

        // Update position (if not new)
        if (!isNewPosition) {
          const updatedPosition = recalculatePositionOnBuy(
            position.qty,
            fromDecimal(position.avgPrice),
            qty,
            executedPrice
          );

          await tx.position.update({
            where: { id: position.id },
            data: {
              qty: updatedPosition.qty,
              avgPrice: toDecimal(updatedPosition.avgPrice),
              updatedAt: new Date(),
            },
          });
        }

        // Update account with properly rounded values
        if (product === "MIS") {
          // For MIS, deduct margin + fees from cash and increase used margin
          const requiredMargin = roundCurrency(
            (executedPrice * qty) / instrument.leverage
          );
          const totalDeduction = roundCurrency(requiredMargin + fees);

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
