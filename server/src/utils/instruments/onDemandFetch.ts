/**
 * On-Demand Instrument Fetcher
 * Automatically fetches and inserts missing instruments from CSV when requested
 */

import { prisma } from "@/database/client";
import { getInstrumentBySymbol, getInstrumentByToken } from "./csvReader";
import type { InstrumentModel } from "@/database/generated/models/Instrument";

/**
 * Fetch instrument by trading symbol
 * If not in DB, try to get from CSV and insert
 */
export async function fetchInstrumentBySymbol(
  tradingSymbol: string
): Promise<InstrumentModel | null> {
  let csvInstrument: any = null;

  try {
    // Step 1: Check database first
    let instrument = await prisma.instrument.findFirst({
      where: { tradingSymbol },
    });

    if (instrument) {
      // Check if expired
      if (instrument.expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(instrument.expiry);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          console.log(`[On-Demand] Instrument ${tradingSymbol} is expired`);
          return null;
        }
      }

      console.log(`[On-Demand] Found ${tradingSymbol} in database`);
      return instrument;
    }

    // Step 2: Not in DB, check CSV
    console.log(
      `[On-Demand] ${tradingSymbol} not found in database, checking CSV...`
    );
    csvInstrument = getInstrumentBySymbol(tradingSymbol);

    if (!csvInstrument) {
      console.log(`[On-Demand] ${tradingSymbol} not found in CSV either`);
      return null;
    }

    // Step 3: Insert into database
    console.log(`[On-Demand] Inserting ${tradingSymbol} into database...`);
    instrument = await prisma.instrument.create({
      data: csvInstrument,
    });

    console.log(`[On-Demand] ✅ Successfully inserted ${tradingSymbol}`);
    return instrument;
  } catch (error) {
    console.error(
      `[On-Demand] Error fetching instrument ${tradingSymbol}:`,
      error
    );

    // If insertion failed due to unique constraint, try fetching again
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint") &&
      csvInstrument?.exchangeToken
    ) {
      const instrument = await prisma.instrument.findUnique({
        where: { exchangeToken: csvInstrument.exchangeToken },
      });
      return instrument;
    }

    throw error;
  }
}

/**
 * Fetch instrument by exchange token
 * If not in DB, try to get from CSV and insert
 */
export async function fetchInstrumentByToken(
  exchangeToken: string
): Promise<InstrumentModel | null> {
  try {
    // Step 1: Check database first
    let instrument = await prisma.instrument.findUnique({
      where: { exchangeToken },
    });

    if (instrument) {
      // Check if expired
      if (instrument.expiry) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = new Date(instrument.expiry);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          console.log(
            `[On-Demand] Instrument with token ${exchangeToken} is expired`
          );
          return null;
        }
      }

      console.log(`[On-Demand] Found token ${exchangeToken} in database`);
      return instrument;
    }

    // Step 2: Not in DB, check CSV
    console.log(
      `[On-Demand] Token ${exchangeToken} not found in database, checking CSV...`
    );
    const csvInstrument = getInstrumentByToken(exchangeToken);

    if (!csvInstrument) {
      console.log(`[On-Demand] Token ${exchangeToken} not found in CSV either`);
      return null;
    }

    // Step 3: Insert into database
    console.log(
      `[On-Demand] Inserting instrument with token ${exchangeToken} into database...`
    );
    instrument = await prisma.instrument.create({
      data: await csvInstrument,
    });

    console.log(
      `[On-Demand] ✅ Successfully inserted instrument with token ${exchangeToken}`
    );
    return instrument;
  } catch (error) {
    console.error(
      `[On-Demand] Error fetching instrument by token ${exchangeToken}:`,
      error
    );

    // If insertion failed due to unique constraint, try fetching again
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      const instrument = await prisma.instrument.findUnique({
        where: { exchangeToken },
      });
      return instrument;
    }

    throw error;
  }
}

/**
 * Fetch instrument by ID with fallback to CSV
 * (Usually ID lookup won't need CSV fallback, but included for consistency)
 */
export async function fetchInstrumentById(
  instrumentId: string
): Promise<InstrumentModel | null> {
  const instrument = await prisma.instrument.findUnique({
    where: { id: instrumentId },
  });

  if (!instrument) {
    console.log(`[On-Demand] Instrument ID ${instrumentId} not found`);
    return null;
  }

  // Check if expired
  if (instrument.expiry) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(instrument.expiry);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      console.log(
        `[On-Demand] Instrument ${instrument.tradingSymbol} (ID: ${instrumentId}) is expired`
      );
      return null;
    }
  }

  return instrument;
}

/**
 * Batch fetch instruments with CSV fallback
 */
export async function fetchInstrumentsBySymbols(
  tradingSymbols: string[]
): Promise<InstrumentModel[]> {
  const results: InstrumentModel[] = [];

  for (const symbol of tradingSymbols) {
    const instrument = await fetchInstrumentBySymbol(symbol);
    if (instrument) {
      results.push(instrument);
    }
  }

  return results;
}
