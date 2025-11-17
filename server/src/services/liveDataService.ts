/**
 * Live Data Service
 * Provides reusable functions to fetch real-time market data
 */

export interface LiveDataOptions {
  scriptCode: string;
  exchange: Exchange;
  type: InstrumentType;
}

export interface LiveDataResult {
  scriptCode: string;
  exchange: Exchange;
  segment: Segment;
  liveData: any;
}

/**
 * Fetches live market data for a given instrument
 * @param options - Configuration options
 * @param options.scriptCode - The script code of the instrument
 * @param options.exchange - The exchange (NSE, BSE, etc.)
 * @param options.type - The instrument type (EQ, IDX, FUT, CE, PE)
 * @returns Promise with live data
 */
export const fetchLiveData = async (
  options: LiveDataOptions
): Promise<LiveDataResult> => {
  const { scriptCode, exchange, type } = options;

  const segment: Segment = type === "EQ" || type === "IDX" ? "CASH" : "FNO";

  let liveDataUrl: string | null = null;

  switch (type) {
    case "EQ":
      liveDataUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/${exchange}/segment/${segment}/${scriptCode}/latest`;
      break;
    case "IDX":
      liveDataUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_indices/exchange/${exchange}/segment/${segment}/${scriptCode}/latest`;
      break;
    case "FUT":
    case "CE":
    case "PE":
      liveDataUrl = `https://groww.in/v1/api/stocks_fo_data/v1/tr_live_prices/exchange/${exchange}/segment/${segment}/${scriptCode}/latest`;
      break;
    default:
      liveDataUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/${exchange}/segment/${segment}/${scriptCode}/latest`;
      break;
  }

  const liveDataResponse = await fetch(liveDataUrl);

  if (!liveDataResponse.ok) {
    throw new Error(
      `Failed to fetch live data: ${liveDataResponse.statusText}`
    );
  }

  const liveData = await liveDataResponse.json();

  return {
    scriptCode,
    exchange,
    segment,
    liveData,
  };
};
