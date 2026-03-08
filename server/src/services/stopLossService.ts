/**
 * Stop Loss Monitoring Service
 * Polls active stop loss orders and triggers execution when price condition is met
 */

import prisma from "@/database/client";
import { executeSell } from "@/utils/trading";
import { getLivePrice } from "@/utils/trading/livePrice";
import { fromDecimal } from "@/utils/currency";
import type { TradeType } from "@/database/generated/enums";

/**
 * Process all active stop loss orders
 * Checks current price against trigger price and executes sell if triggered
 */
export async function processStopLossOrders(): Promise<void> {
  try {
    // Fetch all active stop loss orders with position and instrument data
    const activeOrders = await prisma.stopLossOrder.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        position: {
          include: {
            instrument: true,
          },
        },
      },
    });

    if (activeOrders.length === 0) return;

    console.log(
      `[StopLoss] Processing ${activeOrders.length} active stop loss orders`,
    );

    for (const order of activeOrders) {
      try {
        const { position } = order;

        // Skip if position is already closed
        if (!position.isOpen || position.qty <= 0) {
          await prisma.stopLossOrder.update({
            where: { id: order.id },
            data: {
              status: "CANCELLED",
              errorMessage: "Position already closed",
            },
          });
          continue;
        }

        // Fetch current live price
        const instrument = position.instrument;
        let currentPrice: number;
        try {
          currentPrice = await getLivePrice(
            instrument.tradingSymbol,
            instrument.exchange,
            instrument.type,
            instrument.exchangeToken ?? undefined,
          );
        } catch (priceError) {
          // Skip this order if we can't get the price - will retry next cycle
          console.warn(
            `[StopLoss] Could not get price for ${instrument.tradingSymbol}: ${priceError}`,
          );
          continue;
        }

        const triggerPrice = fromDecimal(order.triggerPrice);

        // Stop loss triggers when current price falls to or below trigger price
        if (currentPrice > triggerPrice) {
          continue; // Price hasn't hit trigger yet
        }

        console.log(
          `[StopLoss] TRIGGERED: ${instrument.tradingSymbol} price ${currentPrice} <= trigger ${triggerPrice}`,
        );

        // Mark as triggered
        await prisma.stopLossOrder.update({
          where: { id: order.id },
          data: {
            status: "TRIGGERED",
            triggeredAt: new Date(),
          },
        });

        // Determine quantity to sell
        const sellQty =
          order.qty > 0 ? Math.min(order.qty, position.qty) : position.qty;

        // Execute the sell order
        try {
          const result = await executeSell({
            userId: order.userId,
            instrumentId: instrument.id,
            qty: sellQty,
            product: position.product as TradeType,
          });

          await prisma.stopLossOrder.update({
            where: { id: order.id },
            data: {
              status: "EXECUTED",
              transactionId: result.transactionId,
              executedPrice: result.executedPrice,
            },
          });

          console.log(
            `[StopLoss] EXECUTED: ${instrument.tradingSymbol} sold ${sellQty} @ ₹${result.executedPrice}`,
          );
        } catch (execError: any) {
          console.error(
            `[StopLoss] FAILED: ${instrument.tradingSymbol}:`,
            execError?.message,
          );

          await prisma.stopLossOrder.update({
            where: { id: order.id },
            data: {
              status: "FAILED",
              errorMessage: execError?.message || "Stop loss execution failed",
            },
          });
        }
      } catch (orderError) {
        console.error(
          `[StopLoss] Error processing order ${order.id}:`,
          orderError,
        );
      }
    }
  } catch (error) {
    console.error("[StopLoss] Error in processStopLossOrders:", error);
  }
}
