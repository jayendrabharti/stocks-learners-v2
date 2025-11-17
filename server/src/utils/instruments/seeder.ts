/**
 * Instrument Seeder
 * Seeds missing non-expired instruments from CSV to database
 */

import { prisma } from "@/database/client";
import { getNonExpiredInstrumentsFromCSV } from "./csvReader";
import { findMissingInstruments, getSyncSummary } from "./diffChecker";
import type { ParsedInstrument } from "./csvReader";

/**
 * Insert instruments into database in batches
 */
async function insertInstrumentsBatch(
  instruments: ParsedInstrument[]
): Promise<number> {
  let insertedCount = 0;
  const BATCH_SIZE = 1000;

  for (let i = 0; i < instruments.length; i += BATCH_SIZE) {
    const batch = instruments.slice(i, i + BATCH_SIZE);

    try {
      await prisma.instrument.createMany({
        data: batch,
        skipDuplicates: true, // Skip if tradingSymbol or exchangeToken already exists
      });

      insertedCount += batch.length;
      console.log(
        `[Seeder] Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${
          batch.length
        } instruments (Total: ${insertedCount}/${instruments.length})`
      );
    } catch (error) {
      console.error(
        `[Seeder] Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
        error
      );

      // If batch fails, try inserting one by one
      console.log(
        `[Seeder] Retrying batch ${
          Math.floor(i / BATCH_SIZE) + 1
        } one by one...`
      );
      for (const inst of batch) {
        try {
          await prisma.instrument.create({
            data: inst,
          });
          insertedCount++;
        } catch (err) {
          console.error(
            `[Seeder] Failed to insert ${inst.tradingSymbol}:`,
            err instanceof Error ? err.message : err
          );
        }
      }
    }
  }

  return insertedCount;
}

/**
 * Main seeder function
 * Idempotent and safe to run multiple times
 */
export async function seedInstruments(): Promise<{
  success: boolean;
  message: string;
  csvCount: number;
  dbCountBefore: number;
  dbCountAfter: number;
  inserted: number;
}> {
  try {
    console.log("\n=== Instrument Seeding Started ===\n");

    // Step 1: Get instruments from CSV
    const csvInstruments = getNonExpiredInstrumentsFromCSV();
    console.log(
      `[Seeder] CSV contains ${csvInstruments.length} non-expired instruments`
    );

    // Step 2: Get sync summary
    const summaryBefore = await getSyncSummary(prisma, csvInstruments);
    console.log(
      `[Seeder] Database currently has ${summaryBefore.dbCount} non-expired instruments`
    );
    console.log(`[Seeder] Missing instruments: ${summaryBefore.missingCount}`);

    // Step 3: Check if seeding is needed
    if (!summaryBefore.needsSync) {
      console.log(
        "[Seeder] ✅ Database is already up-to-date. No seeding required."
      );
      console.log("\n=== Seeding Complete ===\n");

      return {
        success: true,
        message: "Database already up-to-date",
        csvCount: csvInstruments.length,
        dbCountBefore: summaryBefore.dbCount,
        dbCountAfter: summaryBefore.dbCount,
        inserted: 0,
      };
    }

    // Step 4: Find missing instruments
    const missingInstruments = await findMissingInstruments(
      prisma,
      csvInstruments
    );
    console.log(
      `[Seeder] Inserting ${missingInstruments.length} missing instruments...`
    );

    // Step 5: Insert missing instruments
    const inserted = await insertInstrumentsBatch(missingInstruments);

    // Step 6: Verify final count
    const summaryAfter = await getSyncSummary(prisma, csvInstruments);

    console.log(`[Seeder] ✅ Successfully inserted ${inserted} instruments`);
    console.log(
      `[Seeder] Database now has ${summaryAfter.dbCount} non-expired instruments`
    );
    console.log("\n=== Seeding Complete ===\n");

    return {
      success: true,
      message: `Successfully seeded ${inserted} instruments`,
      csvCount: csvInstruments.length,
      dbCountBefore: summaryBefore.dbCount,
      dbCountAfter: summaryAfter.dbCount,
      inserted,
    };
  } catch (error) {
    console.error("[Seeder] ❌ Seeding failed:", error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      csvCount: 0,
      dbCountBefore: 0,
      dbCountAfter: 0,
      inserted: 0,
    };
  }
}

/**
 * Quick sync - only insert missing instruments without detailed logging
 */
export async function quickSyncInstruments(): Promise<number> {
  const csvInstruments = getNonExpiredInstrumentsFromCSV();
  const missing = await findMissingInstruments(prisma, csvInstruments);

  if (missing.length === 0) {
    return 0;
  }

  return await insertInstrumentsBatch(missing);
}
