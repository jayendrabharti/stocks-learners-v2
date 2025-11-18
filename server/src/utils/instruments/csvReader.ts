/**
 * CSV Reader for Instrument Master
 * Parses CSV file and filters non-expired instruments
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import axios from "axios";
import { pipeline } from "stream/promises";
import { createWriteStream } from "fs";
import type {
  Exchange,
  Segment,
  InstrumentType,
} from "@/database/generated/enums";

export interface CSVInstrumentRow {
  exchange: string;
  exchange_token: string;
  trading_symbol: string;
  groww_symbol: string;
  name: string;
  instrument_type: string;
  segment: string;
  series: string;
  isin: string;
  underlying_symbol: string;
  underlying_exchange_token: string;
  expiry_date: string;
  strike_price: string;
  lot_size: string;
  tick_size: string;
  freeze_quantity: string;
  is_reserved: string;
  buy_allowed: string;
  sell_allowed: string;
  internal_trading_symbol: string;
  is_intraday: string;
}

export interface ParsedInstrument {
  exchange: Exchange;
  segment: Segment;
  series: string | null;
  tradingSymbol: string;
  exchangeToken: string;
  growwSymbol: string | null;
  name: string | null;
  isin: string | null;
  type: InstrumentType;
  expiry: Date | null;
  strike: number | null;
  underlyingSymbol: string | null;
  underlyingExchangeToken: string | null;
  lotSize: number;
  tickSize: number;
  freezeQty: number;
  buyAllowed: boolean;
  sellAllowed: boolean;
  isReserved: boolean;
  leverage: number;
}

const INSTRUMENT_CSV_URL =
  process.env.INSTRUMENT_CSV_URL ??
  "https://growwapi-assets.groww.in/instruments/instrument.csv";

const CACHE_DIRECTORY = path.resolve(
  process.cwd(),
  process.env.INSTRUMENT_CACHE_DIR ?? "cache"
);

/**
 * Downloads fresh instrument CSV and returns the file path
 */
async function downloadFreshCsv(): Promise<string> {
  await fs.promises.mkdir(CACHE_DIRECTORY, { recursive: true });

  const timestamp = Date.now();
  const tempFilePath = path.join(
    CACHE_DIRECTORY,
    `instrument-${timestamp}.csv`
  );
  const tempDownloadPath = `${tempFilePath}.tmp`;

  const response = await axios.get(INSTRUMENT_CSV_URL, {
    responseType: "stream",
  });

  const writer = createWriteStream(tempDownloadPath);

  try {
    await pipeline(response.data, writer);
    await fs.promises.rename(tempDownloadPath, tempFilePath);
    console.log(`[CSV Reader] Fresh CSV downloaded: ${tempFilePath}`);
    return tempFilePath;
  } catch (error) {
    await fs.promises.rm(tempDownloadPath, { force: true });
    throw error;
  }
}

/**
 * Cleanup downloaded CSV file
 */
async function cleanupCsvFile(filePath: string): Promise<void> {
  try {
    await fs.promises.rm(filePath, { force: true });
    console.log(`[CSV Reader] Cleaned up CSV: ${filePath}`);
  } catch (error) {
    console.error(`[CSV Reader] Failed to cleanup CSV:`, error);
  }
}

/**
 * Read and parse CSV file from given path
 */
function readInstrumentCSVFromPath(csvPath: string): CSVInstrumentRow[] {
  try {
    const fileContent = fs.readFileSync(csvPath, "utf-8");

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVInstrumentRow[];

    return records;
  } catch (error) {
    console.error("[CSV Reader] Error reading CSV file:", error);
    throw new Error(
      `Failed to read instrument CSV: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Parse CSV row to Prisma-compatible instrument object
 */
export function parseInstrumentRow(row: CSVInstrumentRow): ParsedInstrument {
  // Parse expiry date
  let expiry: Date | null = null;
  if (row.expiry_date && row.expiry_date.trim() !== "") {
    const parsed = new Date(row.expiry_date);
    expiry = isNaN(parsed.getTime()) ? null : parsed;
  }

  // Parse strike price
  const strike =
    row.strike_price && row.strike_price.trim() !== ""
      ? parseFloat(row.strike_price)
      : null;

  // Determine leverage based on segment (F&O gets higher leverage)
  const leverage = row.segment === "FNO" ? 5 : 1;

  return {
    exchange: row.exchange.toUpperCase() as Exchange,
    segment: row.segment.toUpperCase() as Segment,
    series: row.series && row.series.trim() !== "" ? row.series : null,
    tradingSymbol: row.trading_symbol,
    exchangeToken: row.exchange_token,
    growwSymbol:
      row.groww_symbol && row.groww_symbol.trim() !== ""
        ? row.groww_symbol
        : null,
    name: row.name && row.name.trim() !== "" ? row.name : null,
    isin: row.isin && row.isin.trim() !== "" ? row.isin : null,
    type: row.instrument_type.toUpperCase() as InstrumentType,
    expiry,
    strike,
    underlyingSymbol:
      row.underlying_symbol && row.underlying_symbol.trim() !== ""
        ? row.underlying_symbol
        : null,
    underlyingExchangeToken:
      row.underlying_exchange_token &&
      row.underlying_exchange_token.trim() !== ""
        ? row.underlying_exchange_token
        : null,
    lotSize: parseInt(row.lot_size) || 1,
    tickSize: parseFloat(row.tick_size) || 0.05,
    freezeQty: parseInt(row.freeze_quantity) || 0,
    buyAllowed: row.buy_allowed === "1" || row.buy_allowed === "true",
    sellAllowed: row.sell_allowed === "1" || row.sell_allowed === "true",
    isReserved: row.is_reserved === "1" || row.is_reserved === "true",
    leverage,
  };
}

/**
 * Filter non-expired instruments
 * An instrument is non-expired if:
 * - It has no expiry (CASH segment stocks)
 * - OR expiry >= today (F&O contracts)
 */
export function filterNonExpired(
  instruments: ParsedInstrument[]
): ParsedInstrument[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  return instruments.filter((inst) => {
    // No expiry = always valid (CASH segment)
    if (!inst.expiry) {
      return true;
    }

    // Has expiry = check if >= today
    const expiryDate = new Date(inst.expiry);
    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate >= today;
  });
}

/**
 * Get all non-expired instruments from CSV
 * Downloads fresh CSV and cleans up after use
 */
export async function getNonExpiredInstrumentsFromCSV(): Promise<
  ParsedInstrument[]
> {
  let csvFilePath: string | null = null;

  try {
    console.log("[CSV Reader] Downloading fresh instrument CSV...");
    csvFilePath = await downloadFreshCsv();

    console.log("[CSV Reader] Reading instrument CSV...");
    const rows = readInstrumentCSVFromPath(csvFilePath);
    console.log(`[CSV Reader] Found ${rows.length} total rows in CSV`);

    console.log("[CSV Reader] Parsing instruments...");
    const parsed = rows.map(parseInstrumentRow);

    console.log("[CSV Reader] Filtering non-expired instruments...");
    const nonExpired = filterNonExpired(parsed);
    console.log(
      `[CSV Reader] ${nonExpired.length} non-expired instruments found`
    );

    return nonExpired;
  } finally {
    if (csvFilePath) {
      await cleanupCsvFile(csvFilePath);
    }
  }
}

/**
 * Get specific instrument by trading symbol from CSV
 * Downloads fresh CSV and cleans up after use
 */
export async function getInstrumentBySymbol(
  tradingSymbol: string
): Promise<ParsedInstrument | null> {
  let csvFilePath: string | null = null;

  try {
    csvFilePath = await downloadFreshCsv();
    const rows = readInstrumentCSVFromPath(csvFilePath);
    const row = rows.find((r) => r.trading_symbol === tradingSymbol);

    if (!row) {
      return null;
    }

    const parsed = parseInstrumentRow(row);

    // Check if expired
    if (parsed.expiry) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(parsed.expiry);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        return null; // Expired
      }
    }

    return parsed;
  } finally {
    if (csvFilePath) {
      await cleanupCsvFile(csvFilePath);
    }
  }
}

/**
 * Get specific instrument by exchange token from CSV
 * Downloads fresh CSV and cleans up after use
 */
export async function getInstrumentByToken(
  exchangeToken: string
): Promise<ParsedInstrument | null> {
  let csvFilePath: string | null = null;

  try {
    csvFilePath = await downloadFreshCsv();
    const rows = readInstrumentCSVFromPath(csvFilePath);
    const row = rows.find((r) => r.exchange_token === exchangeToken);

    if (!row) {
      return null;
    }

    const parsed = parseInstrumentRow(row);

    // Check if expired
    if (parsed.expiry) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(parsed.expiry);
      expiryDate.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        return null; // Expired
      }
    }

    return parsed;
  } finally {
    if (csvFilePath) {
      await cleanupCsvFile(csvFilePath);
    }
  }
}
