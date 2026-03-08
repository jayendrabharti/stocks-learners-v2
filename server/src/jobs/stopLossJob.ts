/**
 * Stop Loss Monitoring Cron Job
 * Polls active stop loss orders every 15 seconds during market hours
 */

import * as cron from "node-cron";
import { processStopLossOrders } from "@/services/stopLossService";
import { getMarketStatus } from "@/services/marketService";

let stopLossJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Initialize stop loss monitoring job
 * Runs every 15 seconds during market hours (Mon-Fri, 9:00-15:35 IST)
 */
export const initializeStopLossJob = (): void => {
  try {
    console.log("[StopLoss] Initializing stop loss monitoring job...");

    // Run every 15 seconds, Mon-Fri, 9:00 AM - 3:35 PM IST
    // Using */15 * * * * * (every 15 seconds) with market hour guard
    stopLossJob = cron.schedule(
      "*/15 * * * * *",
      async () => {
        try {
          // Only process during market hours
          const status = await getMarketStatus();
          if (!status.isOpen) return;

          await processStopLossOrders();
        } catch (error) {
          console.error("[StopLoss] Error in monitoring job:", error);
        }
      },
      {
        timezone: "Asia/Kolkata",
      },
    );

    console.log("[StopLoss] Stop loss monitoring job initialized");
  } catch (error) {
    console.error("[StopLoss] Error initializing stop loss job:", error);
  }
};

/**
 * Stop the stop loss monitoring job
 */
export const stopStopLossJob = (): void => {
  if (stopLossJob) {
    stopLossJob.stop();
    stopLossJob = null;
    console.log("[StopLoss] Monitoring job stopped");
  }
};
