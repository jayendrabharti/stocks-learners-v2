/**
 * Admin Instrument Controller
 * Handles instrument management endpoints (admin only)
 */

import type { Request, Response } from "express";
import {
  seedInstruments,
  triggerManualSync,
  getNextSyncTime,
} from "@/utils/instruments";
import { prisma } from "@/database/client";

/**
 * Manually trigger instrument seeding
 * POST /admin/instruments/seed
 */
export async function seedInstrumentsEndpoint(_req: Request, res: Response) {
  try {
    const result = await seedInstruments();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("[Admin] Seed instruments error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Manually trigger instrument sync
 * POST /admin/instruments/sync
 */
export async function syncInstrumentsEndpoint(_req: Request, res: Response) {
  try {
    const result = await triggerManualSync();

    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    console.error("[Admin] Sync instruments error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get instrument sync status
 * GET /admin/instruments/status
 */
export async function getInstrumentStatus(_req: Request, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalCount, nonExpiredCount, expiredCount] = await Promise.all([
      prisma.instrument.count(),
      prisma.instrument.count({
        where: {
          OR: [{ expiry: null }, { expiry: { gte: today } }],
        },
      }),
      prisma.instrument.count({
        where: {
          expiry: { lt: today },
        },
      }),
    ]);

    const nextSyncTime = getNextSyncTime();

    return res.status(200).json({
      success: true,
      data: {
        totalInstruments: totalCount,
        nonExpired: nonExpiredCount,
        expired: expiredCount,
        nextScheduledSync: nextSyncTime,
      },
    });
  } catch (error) {
    console.error("[Admin] Get instrument status error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
