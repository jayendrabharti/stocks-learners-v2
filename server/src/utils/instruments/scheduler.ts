/**
 * Daily Instrument Sync Scheduler
 * Runs every day at 8:00 AM IST to sync instruments from CSV
 */

import cron from "node-cron";
import { quickSyncInstruments } from "./seeder";

/**
 * Schedule daily instrument sync at 8:00 AM IST
 * Cron expression: "0 8 * * *" in IST
 *
 * Note: Node.js runs in UTC by default
 * 8:00 AM IST = 2:30 AM UTC
 */
export function scheduleDailyInstrumentSync(): void {
  // Cron expression for 2:30 AM UTC (8:00 AM IST)
  const cronExpression = "30 2 * * *";

  console.log("[Scheduler] Setting up daily instrument sync at 8:00 AM IST...");

  const task = cron.schedule(
    cronExpression,
    async () => {
      try {
        console.log("\n=== Daily Instrument Sync Started ===");
        console.log(
          `[Scheduler] Time: ${new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })} IST`
        );

        const inserted = await quickSyncInstruments();

        if (inserted > 0) {
          console.log(`[Scheduler] ✅ Synced ${inserted} new instruments`);
        } else {
          console.log("[Scheduler] ✅ No new instruments to sync");
        }

        console.log("=== Daily Instrument Sync Complete ===\n");
      } catch (error) {
        console.error("[Scheduler] ❌ Daily sync failed:", error);
      }
    },
    {
      timezone: "UTC", // Important: cron runs in UTC, we convert time
    }
  );

  task.start();
  console.log(
    `[Scheduler] ✅ Daily sync scheduled at 8:00 AM IST (cron: ${cronExpression})`
  );
}

/**
 * Schedule immediate sync for testing
 * Runs once after 10 seconds
 */
export function scheduleImmediateSync(): void {
  console.log("[Scheduler] Scheduling immediate sync in 10 seconds...");

  setTimeout(async () => {
    try {
      console.log("\n=== Immediate Sync Started ===");
      const inserted = await quickSyncInstruments();

      if (inserted > 0) {
        console.log(`[Scheduler] ✅ Synced ${inserted} new instruments`);
      } else {
        console.log("[Scheduler] ✅ No new instruments to sync");
      }

      console.log("=== Immediate Sync Complete ===\n");
    } catch (error) {
      console.error("[Scheduler] ❌ Immediate sync failed:", error);
    }
  }, 10000);
}

/**
 * Manual trigger for sync
 * Can be called from API endpoint or admin panel
 */
export async function triggerManualSync(): Promise<{
  success: boolean;
  message: string;
  inserted: number;
}> {
  try {
    console.log("[Manual Sync] Starting manual instrument sync...");
    const inserted = await quickSyncInstruments();

    return {
      success: true,
      message:
        inserted > 0
          ? `Successfully synced ${inserted} new instruments`
          : "No new instruments to sync",
      inserted,
    };
  } catch (error) {
    console.error("[Manual Sync] Error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      inserted: 0,
    };
  }
}

/**
 * Get next scheduled sync time in IST
 */
export function getNextSyncTime(): string {
  const now = new Date();
  const nextSync = new Date(now);

  // Set to 8:00 AM IST (2:30 AM UTC)
  nextSync.setUTCHours(2, 30, 0, 0);

  // If already past today's sync time, schedule for tomorrow
  if (nextSync <= now) {
    nextSync.setUTCDate(nextSync.getUTCDate() + 1);
  }

  return nextSync.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
