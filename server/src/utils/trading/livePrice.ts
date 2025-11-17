/**
 * Live Price Utilities
 * Integrates with market data services to fetch real-time prices
 */

import { fetchLiveData } from "@/services";
import type { Exchange, InstrumentType } from "@/database/generated/enums";

export interface LivePriceData {
  ltp: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  dayChange: number;
  dayChangePerc: number;
}

/**
 * Fetches the Last Traded Price (LTP) for an instrument
 * @param scriptCode - The trading symbol of the instrument (e.g., 'BEL', 'SBIN')
 * @param exchange - The exchange (NSE/BSE)
 * @param type - The instrument type (EQ/IDX/FUT/CE/PE)
 * @param exchangeToken - The exchange token (used for BSE script code)
 * @returns The current LTP
 */
export async function getLivePrice(
  scriptCode: string,
  exchange: Exchange,
  type: InstrumentType,
  exchangeToken?: string
): Promise<number> {
  try {
    // For BSE equity/index, use exchange token as script code
    const effectiveScriptCode =
      exchange === "BSE" && (type === "EQ" || type === "IDX") && exchangeToken
        ? exchangeToken
        : scriptCode;

    const result = await fetchLiveData({
      scriptCode: effectiveScriptCode,
      exchange,
      type,
    });

    // Extract LTP from the live data response
    const ltp = result.liveData?.ltp || result.liveData?.close || 0;

    if (ltp === 0) {
      throw new Error(`Unable to fetch live price for ${scriptCode}`);
    }

    return ltp;
  } catch (error) {
    throw new Error(
      `Failed to fetch live price: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetches complete live market data for an instrument
 * @param scriptCode - The trading symbol of the instrument
 * @param exchange - The exchange (NSE/BSE)
 * @param segment - The segment (CASH/FNO)
 * @param type - The instrument type (EQ/IDX/FUT/CE/PE)
 * @returns Complete live market data
 */
export async function getLiveMarketData(
  scriptCode: string,
  exchange: Exchange,
  type: InstrumentType
): Promise<LivePriceData> {
  try {
    const result = await fetchLiveData({
      scriptCode,
      exchange,
      type,
    });

    const data = result.liveData;

    return {
      ltp: data.ltp || data.close || 0,
      high: data.high || 0,
      low: data.low || 0,
      open: data.open || 0,
      close: data.close || 0,
      volume: data.volume || 0,
      dayChange: data.dayChange || 0,
      dayChangePerc: data.dayChangePerc || 0,
    };
  } catch (error) {
    throw new Error(
      `Failed to fetch live market data: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Fetches LTP for multiple instruments in parallel
 * @param instruments - Array of instrument details
 * @returns Map of tradingSymbol to LTP
 */
export async function getBulkLivePrices(
  instruments: Array<{
    tradingSymbol: string;
    exchange: Exchange;
    type: InstrumentType;
    exchangeToken?: string;
  }>
): Promise<Map<string, number>> {
  const priceMap = new Map<string, number>();

  const promises = instruments.map(async (instrument) => {
    try {
      const ltp = await getLivePrice(
        instrument.tradingSymbol,
        instrument.exchange,
        instrument.type,
        instrument.exchangeToken
      );
      priceMap.set(instrument.tradingSymbol, ltp);
    } catch (error) {
      console.error(
        `Failed to fetch price for ${instrument.tradingSymbol}:`,
        error
      );
      priceMap.set(instrument.tradingSymbol, 0);
    }
  });

  await Promise.all(promises);

  return priceMap;
}
