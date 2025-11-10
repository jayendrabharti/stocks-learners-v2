import { Request, Response } from "express";
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

interface InstrumentRow {
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

// Reuse a shared promise so multiple requests don't trigger parallel downloads.
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

const readRowsMatchingSymbol = async (
  tradingSymbol: string
): Promise<InstrumentRow[]> => {
  await ensureCacheAvailable();

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

const readRowsMatchingIsin = async (isin: string): Promise<InstrumentRow[]> => {
  await ensureCacheAvailable();

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

export const Instruments = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tradingSymbolInput =
      (req.params.tradingSymbol as string | undefined) ??
      (req.query.tradingSymbol as string | undefined) ??
      (req.query.trading_symbol as string | undefined);

    const isinInput =
      (req.params.isin as string | undefined) ??
      (req.query.isin as string | undefined);

    // At least one of tradingSymbol or isin must be provided
    if (
      (!tradingSymbolInput && !isinInput) ||
      (tradingSymbolInput && typeof tradingSymbolInput !== "string") ||
      (isinInput && typeof isinInput !== "string")
    ) {
      return res.status(400).json({
        error: {
          message: "Either tradingSymbol or isin is required.",
        },
      });
    }

    const shouldRefreshCache = req.query.refresh === "true";

    if (shouldRefreshCache) {
      await ensureCacheAvailable(true);
    } else {
      await ensureCacheAvailable();
    }

    let rows: InstrumentRow[] = [];

    // If both are provided, search by trading symbol first, then filter by ISIN
    if (tradingSymbolInput && isinInput) {
      const symbolRows = await readRowsMatchingSymbol(tradingSymbolInput);
      const normalizedIsin = isinInput.trim().toUpperCase();
      rows = symbolRows.filter(
        (row) =>
          typeof row.isin === "string" &&
          row.isin.trim().toUpperCase() === normalizedIsin
      );
    } else if (tradingSymbolInput) {
      rows = await readRowsMatchingSymbol(tradingSymbolInput);
    } else if (isinInput) {
      rows = await readRowsMatchingIsin(isinInput);
    }

    if (rows.length === 0) {
      return res.status(404).json({
        error: {
          message: "No instruments found for the provided criteria.",
        },
      });
    }

    return res.status(200).json({
      instruments: rows,
      trading_sysmbol: tradingSymbolInput,
      isin: isinInput,
    });
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve instrument details.",
    });
  }
};
