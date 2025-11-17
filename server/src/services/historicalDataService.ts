/**
 * Historical Data Service
 * Provides reusable functions to fetch historical chart data
 */

export interface HistoricalDataOptions {
  scriptCode: string;
  exchange: Exchange;
  segment: Segment;
  timeRange: HistoricalDataTimeRange;
}

export interface HistoricalDataResult {
  scriptCode: string;
  exchange: Exchange;
  segment: Segment;
  historicalData: any;
}

/**
 * Fetches historical chart data for a given instrument
 * @param options - Configuration options
 * @param options.scriptCode - The script code of the instrument
 * @param options.exchange - The exchange (NSE, BSE, etc.)
 * @param options.segment - The market segment (CASH, FNO)
 * @param options.timeRange - The time range (1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, ALL)
 * @returns Promise with historical data
 */
export const fetchHistoricalData = async (
  options: HistoricalDataOptions
): Promise<HistoricalDataResult> => {
  const { scriptCode, exchange, segment, timeRange } = options;

  let historicalUrl: string | null = null;

  // Determine if the segment is FNO (Futures & Options)
  const isFNO = segment === "FNO";
  const baseUrl = isFNO
    ? `https://groww.in/v1/api/stocks_fo_data/v1/charting_service/chart/exchange/${exchange}/segment/${segment}/${scriptCode}`
    : `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${scriptCode}`;

  switch (timeRange) {
    case "1D":
      historicalUrl = `${baseUrl}/daily?intervalInMinutes=${isFNO ? 5 : 1}`;
      break;
    case "1W":
      historicalUrl = `${baseUrl}/weekly?intervalInMinutes=5`;
      break;
    case "1M":
      historicalUrl = isFNO
        ? `${baseUrl}/monthly?intervalInMinutes=30`
        : `${baseUrl}/monthly?intervalInMinutes=30`;
      break;
    case "3M":
      historicalUrl = `${baseUrl}/monthly/v2?months=3`;
      break;
    case "6M":
      historicalUrl = `${baseUrl}/monthly/v2?months=6`;
      break;
    case "1Y":
      historicalUrl = `${baseUrl}/1y?intervalInDays=1`;
      break;
    case "3Y":
      historicalUrl = `${baseUrl}/3y?intervalInDays=3`;
      break;
    case "5Y":
      historicalUrl = `${baseUrl}/5y?intervalInDays=5`;
      break;
    case "ALL":
      historicalUrl = `${baseUrl}/all?noOfCandles=300`;
      break;
    default:
      throw new Error(
        `Invalid time_range. Supported values: 1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, ALL`
      );
  }

  const historicalResponse = await fetch(historicalUrl);

  if (!historicalResponse.ok) {
    const errorText = await historicalResponse.text();
    throw new Error(
      errorText?.trim().length > 0
        ? errorText.trim()
        : `Failed to fetch historical data: ${historicalResponse.statusText}`
    );
  }

  const historicalData = await historicalResponse.json();

  return {
    scriptCode,
    exchange,
    segment,
    historicalData,
  };
};
