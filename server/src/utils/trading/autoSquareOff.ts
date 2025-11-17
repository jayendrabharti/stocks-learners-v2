/**
 * MIS Auto Square-Off
 * Automatically closes all MIS positions at 3:15 PM IST daily
 */

import prisma from "@/database/client";
import { executeSell } from "./executeSell";
import { getTotalAvailableQty } from "./fifoMatchLots";

export interface AutoSquareOffResult {
  totalPositionsClosed: number;
  successfulSquareOffs: number;
  failedSquareOffs: number;
  details: Array<{
    userId: string;
    instrumentId: string;
    qty: number;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Checks if current time is past 3:15 PM IST
 */
function isPastSquareOffTime(): boolean {
  const now = new Date();

  // Convert to IST (UTC +5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();

  // 3:15 PM = 15:15
  return hours > 15 || (hours === 15 && minutes >= 15);
}

/**
 * Automatically squares off all open MIS positions
 * Should be called at 3:15 PM IST daily
 */
export async function autoSquareOffMISPositions(): Promise<AutoSquareOffResult> {
  console.log("[Auto Square-Off] Starting MIS position square-off...");

  const result: AutoSquareOffResult = {
    totalPositionsClosed: 0,
    successfulSquareOffs: 0,
    failedSquareOffs: 0,
    details: [],
  };

  try {
    // Fetch all open MIS positions
    const openMISPositions = await prisma.position.findMany({
      where: {
        product: "MIS",
        isOpen: true,
        qty: { not: 0 },
      },
      include: {
        instrument: true,
        lots: {
          where: {
            remainingQty: { gt: 0 },
          },
        },
      },
    });

    console.log(
      `[Auto Square-Off] Found ${openMISPositions.length} open MIS positions`
    );

    result.totalPositionsClosed = openMISPositions.length;

    // Square off each position
    for (const position of openMISPositions) {
      try {
        const availableQty = getTotalAvailableQty(position.lots);

        if (availableQty <= 0) {
          console.log(
            `[Auto Square-Off] Skipping position ${position.id} - no available quantity`
          );
          continue;
        }

        // Execute sell to close the position
        await executeSell({
          userId: position.userId,
          instrumentId: position.instrumentId,
          qty: availableQty,
          product: "MIS",
        });

        result.successfulSquareOffs++;
        result.details.push({
          userId: position.userId,
          instrumentId: position.instrumentId,
          qty: availableQty,
          success: true,
        });

        console.log(
          `[Auto Square-Off] Successfully squared off position ${position.id} for user ${position.userId}`
        );
      } catch (error) {
        result.failedSquareOffs++;
        result.details.push({
          userId: position.userId,
          instrumentId: position.instrumentId,
          qty: position.qty,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        console.error(
          `[Auto Square-Off] Failed to square off position ${position.id}:`,
          error
        );
      }
    }

    console.log(
      `[Auto Square-Off] Completed. Success: ${result.successfulSquareOffs}, Failed: ${result.failedSquareOffs}`
    );

    return result;
  } catch (error) {
    console.error("[Auto Square-Off] Critical error:", error);
    throw new Error(
      `Auto square-off failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Schedules the auto square-off job to run at 3:15 PM IST daily
 * This function sets up a cron-like scheduler
 */
export function scheduleAutoSquareOff() {
  // Check every minute if it's time to square off
  const checkInterval = 60 * 1000; // 1 minute
  let hasRunToday = false;

  setInterval(async () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Reset flag at midnight
    if (hours === 0 && minutes === 0) {
      hasRunToday = false;
    }

    // Run at 3:15 PM IST if not already run today
    if (isPastSquareOffTime() && !hasRunToday) {
      console.log("[Auto Square-Off] Triggering scheduled square-off...");
      hasRunToday = true;

      try {
        await autoSquareOffMISPositions();
      } catch (error) {
        console.error("[Auto Square-Off] Scheduled job failed:", error);
      }
    }
  }, checkInterval);

  console.log("[Auto Square-Off] Scheduler initialized");
}

/**
 * Manually trigger square-off for a specific user
 * Useful for testing or manual intervention
 */
export async function squareOffUserMISPositions(
  userId: string
): Promise<AutoSquareOffResult> {
  console.log(
    `[Manual Square-Off] Squaring off MIS positions for user ${userId}`
  );

  const result: AutoSquareOffResult = {
    totalPositionsClosed: 0,
    successfulSquareOffs: 0,
    failedSquareOffs: 0,
    details: [],
  };

  try {
    const openMISPositions = await prisma.position.findMany({
      where: {
        userId,
        product: "MIS",
        isOpen: true,
        qty: { not: 0 },
      },
      include: {
        instrument: true,
        lots: {
          where: {
            remainingQty: { gt: 0 },
          },
        },
      },
    });

    result.totalPositionsClosed = openMISPositions.length;

    for (const position of openMISPositions) {
      try {
        const availableQty = getTotalAvailableQty(position.lots);

        if (availableQty <= 0) continue;

        await executeSell({
          userId: position.userId,
          instrumentId: position.instrumentId,
          qty: availableQty,
          product: "MIS",
        });

        result.successfulSquareOffs++;
        result.details.push({
          userId: position.userId,
          instrumentId: position.instrumentId,
          qty: availableQty,
          success: true,
        });
      } catch (error) {
        result.failedSquareOffs++;
        result.details.push({
          userId: position.userId,
          instrumentId: position.instrumentId,
          qty: position.qty,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  } catch (error) {
    console.error(`[Manual Square-Off] Failed for user ${userId}:`, error);
    throw error;
  }
}
