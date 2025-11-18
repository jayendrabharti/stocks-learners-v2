/**
 * Instruments Service
 * Provides reusable functions to fetch instrument data from CSV cache
 */

import axios from "axios";
import path from "path";
import { promises as fs, createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { parse } from "csv-parse";

export interface InstrumentRow {
  exchange: string;
  exchange_token: string;
  trading_symbol: string;
  groww_symbol?: string;
  name?: string;
  instrument_type?: string;
  segment?: string;
  series?: string;
  isin?: string;
  underlying_symbol?: string;
  underlying_exchange_token?: string;
  expiry_date?: string;
  strike_price?: string;
  lot_size?: string;
  tick_size?: string;
  freeze_quantity?: string;
  is_reserved?: string;
  buy_allowed?: string;
  sell_allowed?: string;
  [additionalColumn: string]: string | undefined;
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
 * File should be deleted after use
 */
const downloadFreshCsv = async (): Promise<string> => {
  await fs.mkdir(CACHE_DIRECTORY, { recursive: true });

  // Create unique temporary file path with timestamp
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
    await fs.rename(tempDownloadPath, tempFilePath);
    console.log(`[InstrumentsService] Fresh CSV downloaded: ${tempFilePath}`);
    return tempFilePath;
  } catch (error) {
    await fs.rm(tempDownloadPath, { force: true });
    throw error;
  }
};

/**
 * Cleanup downloaded CSV file
 */
const cleanupCsvFile = async (filePath: string): Promise<void> => {
  try {
    await fs.rm(filePath, { force: true });
    console.log(`[InstrumentsService] Cleaned up CSV: ${filePath}`);
  } catch (error) {
    console.error(`[InstrumentsService] Failed to cleanup CSV:`, error);
  }
};

/**
 * Fetches instruments matching a trading symbol
 * Always downloads fresh CSV and cleans up after use
 * @param tradingSymbol - The trading symbol to search for
 * @returns Promise with array of matching instrument rows
 */
export const fetchInstrumentsBySymbol = async (
  tradingSymbol: string
): Promise<InstrumentRow[]> => {
  let csvFilePath: string | null = null;

  try {
    // Download fresh CSV
    csvFilePath = await downloadFreshCsv();
    const normalizedSymbol = tradingSymbol.trim().toUpperCase();

    return await new Promise<InstrumentRow[]>((resolve, reject) => {
      const matches: InstrumentRow[] = [];

      const sourceStream = createReadStream(csvFilePath!);
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on("readable", () => {
        let record: InstrumentRow | null;
        while ((record = parser.read()) !== null) {
          if (
            typeof record.trading_symbol === "string" &&
            record.trading_symbol.trim().toUpperCase() === normalizedSymbol
          ) {
            matches.push(record);
          }
        }
      });

      parser.on("error", (error: Error) => reject(error));
      sourceStream.on("error", (error: NodeJS.ErrnoException) => reject(error));

      parser.on("end", () => resolve(matches));

      sourceStream.pipe(parser);
    });
  } finally {
    // Always cleanup the downloaded file
    if (csvFilePath) {
      await cleanupCsvFile(csvFilePath);
    }
  }
};

/**
 * Fetches instruments matching an ISIN
 * Always downloads fresh CSV and cleans up after use
 * @param isin - The ISIN to search for
 * @returns Promise with array of matching instrument rows
 */
export const fetchInstrumentsByIsin = async (
  isin: string
): Promise<InstrumentRow[]> => {
  let csvFilePath: string | null = null;

  try {
    // Download fresh CSV
    csvFilePath = await downloadFreshCsv();
    const normalizedIsin = isin.trim().toUpperCase();

    return await new Promise<InstrumentRow[]>((resolve, reject) => {
      const matches: InstrumentRow[] = [];

      const sourceStream = createReadStream(csvFilePath!);
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      parser.on("readable", () => {
        let record: InstrumentRow | null;
        while ((record = parser.read()) !== null) {
          if (
            typeof record.isin === "string" &&
            record.isin.trim().toUpperCase() === normalizedIsin
          ) {
            matches.push(record);
          }
        }
      });

      parser.on("error", (error: Error) => reject(error));
      sourceStream.on("error", (error: NodeJS.ErrnoException) => reject(error));

      parser.on("end", () => resolve(matches));

      sourceStream.pipe(parser);
    });
  } finally {
    // Always cleanup the downloaded file
    if (csvFilePath) {
      await cleanupCsvFile(csvFilePath);
    }
  }
};

/**
 * Fetches instruments matching both trading symbol and ISIN
 * Always downloads fresh CSV and cleans up after use
 * @param tradingSymbol - The trading symbol to search for
 * @param isin - The ISIN to match
 * @returns Promise with array of matching instrument rows
 */
export const fetchInstrumentsBySymbolAndIsin = async (
  tradingSymbol: string,
  isin: string
): Promise<InstrumentRow[]> => {
  const symbolRows = await fetchInstrumentsBySymbol(tradingSymbol);
  const normalizedIsin = isin.trim().toUpperCase();

  return symbolRows.filter(
    (row) =>
      typeof row.isin === "string" &&
      row.isin.trim().toUpperCase() === normalizedIsin
  );
};
