/**
 * Instrument Diff Checker
 * Compares CSV instruments with database instruments to find missing ones
 */

import type { PrismaClient } from "@/database/generated/client";
import type { ParsedInstrument } from "./csvReader";

/**
 * Get count of non-expired instruments in database
 */
export async function getNonExpiredInstrumentCount(
  prisma: PrismaClient
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.instrument.count({
    where: {
      OR: [
        { expiry: null }, // No expiry (CASH segment)
        { expiry: { gte: today } }, // Expiry >= today
      ],
    },
  });

  return count;
}

/**
 * Get all non-expired instrument trading symbols from database
 */
export async function getNonExpiredInstrumentSymbols(
  prisma: PrismaClient
): Promise<Set<string>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const instruments = await prisma.instrument.findMany({
    where: {
      OR: [{ expiry: null }, { expiry: { gte: today } }],
    },
    select: {
      tradingSymbol: true,
    },
  });

  return new Set(instruments.map((i) => i.tradingSymbol));
}

/**
 * Get all non-expired instrument exchange tokens from database (for unique comparison)
 */
export async function getNonExpiredInstrumentTokensSet(
  prisma: PrismaClient
): Promise<Set<string>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const instruments = await prisma.instrument.findMany({
    where: {
      OR: [{ expiry: null }, { expiry: { gte: today } }],
    },
    select: {
      exchangeToken: true,
    },
  });

  return new Set(instruments.map((i) => i.exchangeToken));
}

/**
 * Get all non-expired instrument exchange tokens from database
 */
export async function getNonExpiredInstrumentTokens(
  prisma: PrismaClient
): Promise<Set<string>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const instruments = await prisma.instrument.findMany({
    where: {
      OR: [{ expiry: null }, { expiry: { gte: today } }],
    },
    select: {
      exchangeToken: true,
    },
  });

  return new Set(instruments.map((i) => i.exchangeToken));
}

/**
 * Compare CSV and DB to find missing instruments
 * Returns instruments that exist in CSV but not in DB
 * Uses exchangeToken for comparison since it's unique
 */
export async function findMissingInstruments(
  prisma: PrismaClient,
  csvInstruments: ParsedInstrument[]
): Promise<ParsedInstrument[]> {
  console.log("[Diff Checker] Fetching existing instruments from database...");

  // Get existing tokens from DB (using exchangeToken which is unique)
  const existingTokens = await getNonExpiredInstrumentTokensSet(prisma);
  console.log(
    `[Diff Checker] Database has ${existingTokens.size} non-expired instruments`
  );

  // Find missing instruments by exchangeToken
  const missing = csvInstruments.filter(
    (inst) => !existingTokens.has(inst.exchangeToken)
  );

  console.log(`[Diff Checker] Found ${missing.length} missing instruments`);
  return missing;
}

/**
 * Check if database needs update
 * Returns true if CSV has more non-expired instruments than DB
 */
export async function needsUpdate(
  prisma: PrismaClient,
  csvInstrumentCount: number
): Promise<boolean> {
  const dbCount = await getNonExpiredInstrumentCount(prisma);

  console.log(
    `[Diff Checker] CSV: ${csvInstrumentCount} instruments, DB: ${dbCount} instruments`
  );

  return csvInstrumentCount > dbCount;
}

/**
 * Get sync summary
 */
export interface SyncSummary {
  csvCount: number;
  dbCount: number;
  missingCount: number;
  needsSync: boolean;
}

export async function getSyncSummary(
  prisma: PrismaClient,
  csvInstruments: ParsedInstrument[]
): Promise<SyncSummary> {
  const dbCount = await getNonExpiredInstrumentCount(prisma);
  const csvCount = csvInstruments.length;
  const missing = await findMissingInstruments(prisma, csvInstruments);

  return {
    csvCount,
    dbCount,
    missingCount: missing.length,
    needsSync: missing.length > 0,
  };
}
