/**
 * Instruments Service
 * Provides reusable functions to fetch instrument data from CSV cache
 */

import axios from "axios";
import path from "path";
import {
  promises as fs,
  constants as fsConstants,
  createWriteStream,
  createReadStream,
} from "fs";
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

const CACHE_FILE_NAME = process.env.INSTRUMENT_CACHE_FILE ?? "instrument.csv";

const CACHE_FILE_PATH = path.join(CACHE_DIRECTORY, CACHE_FILE_NAME);

let cacheWarmPromise: Promise<void> | null = null;

/**
 * Ensures the instrument CSV cache is available
 * @param forceRefresh - Force download even if cache exists
 */
const ensureCacheAvailable = async (forceRefresh = false): Promise<void> => {
  if (cacheWarmPromise) {
    return cacheWarmPromise;
  }

  cacheWarmPromise = (async () => {
    if (!forceRefresh) {
      const cacheExists = await doesCacheExist();
      if (cacheExists) {
        return;
      }
    }

    await downloadAndPersistCsv();
  })()
    .catch((error) => {
      // Clear the promise so future callers can retry after a failure.
      cacheWarmPromise = null;
      throw error;
    })
    .finally(() => {
      cacheWarmPromise = null;
    });

  return cacheWarmPromise;
};

/**
 * Checks if the cache file exists
 */
const doesCacheExist = async (): Promise<boolean> => {
  try {
    await fs.access(CACHE_FILE_PATH, fsConstants.F_OK);
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return false;
    }
    throw error;
  }
};

/**
 * Downloads and persists the instrument CSV from external source
 */
const downloadAndPersistCsv = async (): Promise<void> => {
  await fs.mkdir(CACHE_DIRECTORY, { recursive: true });

  const response = await axios.get(INSTRUMENT_CSV_URL, {
    responseType: "stream",
  });

  const temporaryPath = `${CACHE_FILE_PATH}.tmp`;
  const writer = createWriteStream(temporaryPath);

  try {
    await pipeline(response.data, writer);
    await fs.rm(CACHE_FILE_PATH, { force: true });
    await fs.rename(temporaryPath, CACHE_FILE_PATH);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    throw error;
  }
};

/**
 * Fetches instruments matching a trading symbol
 * @param tradingSymbol - The trading symbol to search for
 * @param shouldRefresh - Whether to refresh the cache before searching
 * @returns Promise with array of matching instrument rows
 */
export const fetchInstrumentsBySymbol = async (
  tradingSymbol: string,
  shouldRefresh = false
): Promise<InstrumentRow[]> => {
  await ensureCacheAvailable(shouldRefresh);

  const normalizedSymbol = tradingSymbol.trim().toUpperCase();

  return new Promise<InstrumentRow[]>((resolve, reject) => {
    const matches: InstrumentRow[] = [];

    const sourceStream = createReadStream(CACHE_FILE_PATH);
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
};

/**
 * Fetches instruments matching an ISIN
 * @param isin - The ISIN to search for
 * @param shouldRefresh - Whether to refresh the cache before searching
 * @returns Promise with array of matching instrument rows
 */
export const fetchInstrumentsByIsin = async (
  isin: string,
  shouldRefresh = false
): Promise<InstrumentRow[]> => {
  await ensureCacheAvailable(shouldRefresh);

  const normalizedIsin = isin.trim().toUpperCase();

  return new Promise<InstrumentRow[]>((resolve, reject) => {
    const matches: InstrumentRow[] = [];

    const sourceStream = createReadStream(CACHE_FILE_PATH);
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
};

/**
 * Fetches instruments matching both trading symbol and ISIN
 * @param tradingSymbol - The trading symbol to search for
 * @param isin - The ISIN to match
 * @param shouldRefresh - Whether to refresh the cache before searching
 * @returns Promise with array of matching instrument rows
 */
export const fetchInstrumentsBySymbolAndIsin = async (
  tradingSymbol: string,
  isin: string,
  shouldRefresh = false
): Promise<InstrumentRow[]> => {
  const symbolRows = await fetchInstrumentsBySymbol(
    tradingSymbol,
    shouldRefresh
  );
  const normalizedIsin = isin.trim().toUpperCase();

  return symbolRows.filter(
    (row) =>
      typeof row.isin === "string" &&
      row.isin.trim().toUpperCase() === normalizedIsin
  );
};
