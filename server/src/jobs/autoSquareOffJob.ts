/**
 * Auto Square-off Cron Job
 * Schedules and runs auto square-off for MIS positions
 */

import * as cron from "node-cron";
import {
  processPendingSquareOffs,
  getNextMarketCloseTime,
} from "@/services/autoSquareOffService";

let squareOffJob: ReturnType<typeof cron.schedule> | null = null;
let checkIntervalJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Initialize auto square-off cron jobs
 */
export const initializeAutoSquareOffJobs = async (): Promise<void> => {
  try {
    console.log("Initializing auto square-off jobs...");

    // On server startup, immediately check for missed square-offs
    console.log("Checking for missed square-offs on startup...");
    await processPendingSquareOffs();

    // Schedule the next market close square-off
    await scheduleNextSquareOff();

    // Run periodic checks every 5 minutes for missed/failed square-offs
    checkIntervalJob = cron.schedule("*/5 * * * *", async () => {
      console.log("Running periodic square-off check...");
      await processPendingSquareOffs();
    });

    console.log("Auto square-off jobs initialized successfully");
  } catch (error) {
    console.error("Error initializing auto square-off jobs:", error);
  }
};

/**
 * Schedule the next square-off at market close time
 */
const scheduleNextSquareOff = async (): Promise<void> => {
  try {
    const nextCloseTime = await getNextMarketCloseTime();
    const now = new Date();
    const delay = nextCloseTime.getTime() - now.getTime();

    if (delay <= 0) {
      // Next close time is in the past, run immediately
      console.log(
        "Market close time is in the past. Running square-off now..."
      );
      await processPendingSquareOffs();
      // Schedule the next one
      await scheduleNextSquareOff();
      return;
    }

    console.log(
      `Next auto square-off scheduled for: ${nextCloseTime.toISOString()} (in ${Math.round(
        delay / 1000 / 60
      )} minutes)`
    );

    // Cancel existing job if any
    if (squareOffJob) {
      squareOffJob.stop();
    }

    // Use setTimeout for the next square-off
    setTimeout(async () => {
      console.log("Executing scheduled auto square-off...");
      await processPendingSquareOffs();
      // Schedule the next one
      await scheduleNextSquareOff();
    }, delay);
  } catch (error) {
    console.error("Error scheduling next square-off:", error);
    // Retry after 5 minutes
    setTimeout(() => scheduleNextSquareOff(), 5 * 60 * 1000);
  }
};

/**
 * Stop all auto square-off jobs
 */
export const stopAutoSquareOffJobs = (): void => {
  console.log("Stopping auto square-off jobs...");

  if (squareOffJob) {
    squareOffJob.stop();
    squareOffJob = null;
  }

  if (checkIntervalJob) {
    checkIntervalJob.stop();
    checkIntervalJob = null;
  }

  console.log("Auto square-off jobs stopped");
};
