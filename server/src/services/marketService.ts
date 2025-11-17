/**
 * Market Service
 * Provides reusable functions to fetch market data from external APIs
 */

// Types for API responses
interface Stock {
  isin: string;
  gsin?: string;
  companyName: string;
  companyShortName: string;
  searchId: string;
  ltp: number;
  logoUrl: string;
  nseScriptCode: string;
  bseScriptCode: string;
  type: string;
  marketCap?: number;
  volumeWeekAvg?: number;
  close: number;
  yearHigh: number;
  yearLow: number;
  volume?: number;
  tag?: string;
  tagColor?: string;
}

interface MostBoughtStock {
  company: {
    isin: string;
    growwContractId: string;
    companyName: string;
    searchId: string;
    nseScriptCode: string;
    companyShortName: string;
    bseScriptCode: string;
    imageUrl: string;
  };
  stats: {
    type: string;
    high: number;
    low: number;
    close: number;
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
    lowPriceRange: number;
    highPriceRange: number;
  };
}

interface TopMoversResponse {
  data: {
    title: string;
    stocks: Stock[];
  };
}

interface MostBoughtResponse {
  exploreCompanies: {
    POPULAR_STOCKS_MOST_BOUGHT: MostBoughtStock[];
  };
}

interface MarketTimingResponse {
  dateMarketTimeMap: {
    [date: string]: {
      marketOpenTime: string;
      marketCloseTime: string;
      preOpenStartTime: string;
      preOpenEndTime: string;
    };
  };
}

interface FnOUnderlyingRaw {
  underlyingSymbolDetails: {
    companyName: string;
    searchId: string;
    exchange: string;
    underlyingType: string;
    symbol: string;
    companyShortName: string;
    logoUrl: string;
  };
  livePriceDetails: {
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
    volume: number | null;
  };
}

interface FnOUnderlying {
  searchId: string;
  companyName: string;
  companyShortName: string;
  nseScriptCode: string;
  ltp: number;
  dayChangePerc: number;
  oi: number;
  oiChangePerc: number;
  volume: number;
}

interface FnOContractRaw {
  contractDetails: {
    contractName: string;
    growwContractId: string;
    searchId: string;
    symbol: string;
    exchange: string;
    logoUrl: string;
    strikePrice?: number;
    expiryDate?: string;
    optionType?: string;
  };
  livePriceDetailsDto: {
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
    volume: number;
    oi?: number;
  };
}

interface FnOContract {
  searchId: string;
  companyName: string;
  contractType: string;
  expiryDate: string;
  strikePrice?: number | undefined;
  ltp: number;
  dayChangePerc: number;
  oi: number;
  volume: number;
}

interface IndexHeader {
  searchId: string;
  growwCompanyId: string;
  isin: string;
  displayName: string;
  shortName: string;
  type: string;
  isFnoEnabled: boolean;
  nseScriptCode?: string;
  bseScriptCode?: string;
  isBseTradable: boolean;
  isNseTradable: boolean;
  logoUrl: string;
  floatingShares?: number;
  isBseFnoEnabled: boolean;
  isNseFnoEnabled: boolean;
}

interface IndexData {
  header: IndexHeader;
  yearLowPrice?: number;
  yearHighPrice?: number;
}

export interface IndicesResponse {
  allAssets: IndexData[];
}

export type MoverType = "gainers" | "losers" | "volume";

// API Base URL
const GROWW_API_BASE = "https://groww.in/v1/api/stocks_data/v1";

interface FetchMostBoughtOptions {
  size?: number;
}

interface FetchTopMoversOptions {
  type?: MoverType;
  pageSize?: number;
}

/**
 * Fetches most bought stocks from Groww
 * @param options - Configuration options
 * @param options.size - Number of stocks to fetch (default: 10)
 * @returns Promise with most bought stocks data
 */
export const fetchMostBoughtStocks = async (
  options: FetchMostBoughtOptions = {}
): Promise<MostBoughtStock[]> => {
  const { size = 10 } = options;

  const response = await fetch(
    `https://groww.in/v1/api/stocks_data/v2/explore/list/top?discoveryFilterTypes=POPULAR_STOCKS_MOST_BOUGHT&page=0&size=${size}`,
    {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        DNT: "1",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://groww.in/stocks",
        Origin: "https://groww.in",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch most bought stocks: ${response.statusText}`
    );
  }

  const data = (await response.json()) as MostBoughtResponse;
  return data.exploreCompanies.POPULAR_STOCKS_MOST_BOUGHT;
};

/**
 * Fetches top market movers (gainers, losers, or volume shakers)
 * @param options - Configuration options
 * @param options.type - Type of movers: 'gainers', 'losers', or 'volume' (default: 'gainers')
 * @param options.pageSize - Number of stocks to fetch (default: 10)
 * @returns Promise with top movers stocks data
 */
export const fetchTopMovers = async (
  options: FetchTopMoversOptions = {}
): Promise<Stock[]> => {
  const { type = "gainers", pageSize = 10 } = options;

  let moverType: string;
  let indice = "GIDXNIFTY100";

  switch (type.toLowerCase()) {
    case "gainers":
      moverType = "TOP_GAINERS";
      break;
    case "losers":
      moverType = "TOP_LOSERS";
      break;
    case "volume":
      moverType = "VOLUME_SHOCKERS";
      indice = ""; // Volume shockers don't need an indice
      break;
    default:
      throw new Error("Invalid type. Use 'gainers', 'losers', or 'volume'");
  }

  const url =
    type.toLowerCase() === "volume"
      ? `https://groww.in/bff/web/stocks/web-pages/top_movers?moverType=${moverType}&pageSize=${pageSize}`
      : `https://groww.in/bff/web/stocks/web-pages/top_movers?indice=${indice}&moverType=${moverType}&pageSize=${pageSize}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      DNT: "1",
      Pragma: "no-cache",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Referer: "https://groww.in/stocks",
      Origin: "https://groww.in",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch top movers: ${response.statusText}`);
  }

  const data = (await response.json()) as TopMoversResponse;
  return data.data.stocks;
};

/**
 * Fetches market timing information
 * @returns Promise with market timing data
 */
export const fetchMarketTiming = async (): Promise<MarketTimingResponse> => {
  const response = await fetch(
    `https://groww.in/v1/api/stocks_data/v1/market/market_timing`,
    {
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://groww.in/",
        Origin: "https://groww.in",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch market timing: ${response.statusText}`);
  }

  return (await response.json()) as MarketTimingResponse;
};

/**
 * Checks if market is currently open
 * @returns Promise with market status
 */
export const getMarketStatus = async (): Promise<{
  isOpen: boolean;
  nextOpenTime?: string;
  nextCloseTime?: string;
}> => {
  try {
    const timingData = await fetchMarketTiming();

    // Get current time
    const now = new Date();

    // Determine today's date in IST
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split("T")[0];

    const todayTiming = timingData.dateMarketTimeMap[today];

    if (!todayTiming) {
      // If no timing for today, market is closed
      // Find next available trading day
      const dates = Object.keys(timingData.dateMarketTimeMap).sort();
      const nextDate = dates.find((date) => date > today);

      if (nextDate) {
        const nextTiming = timingData.dateMarketTimeMap[nextDate];
        const [hours, minutes] = nextTiming.marketOpenTime.split(":");
        const nextOpenIST = new Date(
          `${nextDate}T${hours}:${minutes}:00+05:30`
        );
        return {
          isOpen: false,
          nextOpenTime: nextOpenIST.toISOString(),
        };
      }

      return { isOpen: false };
    }

    // Parse time strings and create IST datetimes for today
    const [openHours, openMinutes] = todayTiming.marketOpenTime.split(":");
    const [closeHours, closeMinutes] = todayTiming.marketCloseTime.split(":");

    const openTime = new Date(`${today}T${openHours}:${openMinutes}:00+05:30`);
    const closeTime = new Date(
      `${today}T${closeHours}:${closeMinutes}:00+05:30`
    );

    const isOpen = now >= openTime && now <= closeTime;

    // If market is closed and current time is after close time, show tomorrow's open time
    if (!isOpen && now > closeTime) {
      const dates = Object.keys(timingData.dateMarketTimeMap).sort();
      const nextDate = dates.find((date) => date > today);

      if (nextDate) {
        const nextTiming = timingData.dateMarketTimeMap[nextDate];
        const [hours, minutes] = nextTiming.marketOpenTime.split(":");
        const nextOpenIST = new Date(
          `${nextDate}T${hours}:${minutes}:00+05:30`
        );
        return {
          isOpen: false,
          nextOpenTime: nextOpenIST.toISOString(),
        };
      }
    }

    return {
      isOpen,
      nextOpenTime: isOpen ? undefined : openTime.toISOString(),
      nextCloseTime: isOpen ? closeTime.toISOString() : undefined,
    };
  } catch (error) {
    return { isOpen: false };
  }
};

/**
 * Fetches top traded F&O underlyings
 * @param limit - Number of underlyings to fetch
 * @returns Promise with top traded underlyings
 */
export const fetchFnOTopUnderlyings = async (
  limit: number = 6
): Promise<FnOUnderlying[]> => {
  const response = await fetch(
    `https://groww.in/v1/api/stocks_fo_data/v1/live-aggregations/explore/top-traded-underlyings?limit=${limit}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://groww.in/",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch F&O underlyings: ${response.statusText}`);
  }

  const data = await response.json();
  const rawUnderlyings =
    (data as { topTradedUnderlyings?: FnOUnderlyingRaw[] })
      .topTradedUnderlyings || [];

  // Map the raw data to our frontend-expected format
  return rawUnderlyings.map(
    (item): FnOUnderlying => ({
      searchId: item.underlyingSymbolDetails.searchId,
      companyName: item.underlyingSymbolDetails.companyName,
      companyShortName: item.underlyingSymbolDetails.companyShortName,
      nseScriptCode: item.underlyingSymbolDetails.symbol,
      ltp: item.livePriceDetails.ltp,
      dayChangePerc: item.livePriceDetails.dayChangePerc,
      volume: item.livePriceDetails.volume || 0,
      oi: 0,
      oiChangePerc: 0,
    })
  );
};

/**
 * Fetches F&O market trends
 * @param instrument - Instrument type
 * @param options - Configuration options
 * @returns Promise with market trends
 */
export const fetchFnOMarketTrends = async (
  instrument: string,
  options: {
    exchange?: string;
    interval?: string;
    limit?: number;
    marketTrendFactor?: string;
    type?: string;
  } = {}
): Promise<any> => {
  const {
    exchange = "NSE",
    interval = "ONE_DAY",
    limit = 10,
    marketTrendFactor = "PRICE",
    type = "GAINERS",
  } = options;

  const response = await fetch(
    `https://groww.in/v1/api/stocks_fo_data/v1/live-aggregations/explore/market_trends/instrument/${instrument}?exchange=${exchange}&interval=${interval}&limit=${limit}&marketTrendFactor=${marketTrendFactor}&type=${type}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://groww.in/",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch F&O trends: ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Fetches top traded F&O contracts
 * @param options - Configuration options
 * @returns Promise with top traded contracts
 */
export const fetchFnOTopContracts = async (
  options: {
    exchange?: string;
    instruments?: string;
    limit?: number;
  } = {}
): Promise<FnOContract[]> => {
  const {
    exchange = "NSE",
    instruments = "INDEX_FUTURES,STOCKS_FUTURES",
    limit = 10,
  } = options;

  const response = await fetch(
    `https://groww.in/v1/api/stocks_fo_data/v1/live-aggregations/explore/market_trends/top-traded-contracts?exchange=${exchange}&instruments=${instruments}&limit=${limit}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://groww.in/",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch F&O contracts: ${response.statusText}`);
  }

  const data = await response.json();
  const contractsMap =
    (data as { contractsMap?: Record<string, FnOContractRaw[]> })
      .contractsMap || {};

  // Flatten all contract types into a single array and map to frontend format
  const allContracts: FnOContract[] = [];

  for (const contractType in contractsMap) {
    const contracts = contractsMap[contractType] || [];
    contracts.forEach((item) => {
      allContracts.push({
        searchId: item.contractDetails.searchId,
        companyName: item.contractDetails.contractName,
        contractType: contractType.replace("_", " "),
        expiryDate: item.contractDetails.expiryDate || "",
        strikePrice: item.contractDetails.strikePrice,
        ltp: item.livePriceDetailsDto.ltp,
        dayChangePerc: item.livePriceDetailsDto.dayChangePerc,
        oi: item.livePriceDetailsDto.oi || 0,
        volume: item.livePriceDetailsDto.volume,
      });
    });
  }

  // Return up to the limit
  return allContracts.slice(0, limit);
};

// Index symbol mapping for major indices
const INDEX_SYMBOL_MAP: Record<string, string> = {
  sensex: "sp-bse-sensex",
  nifty: "nifty",
  banknifty: "nifty-bank",
  finnifty: "nifty-financial-services",
  midcapnifty: "nifty-midcap-100",
};

/**
 * Fetch indices by search term
 * @param searchTerm - Optional search term to filter indices
 * @param page - Page number for pagination
 * @param size - Number of results per page
 * @returns Promise with indices data
 */
export const fetchIndices = async (
  searchTerm: string = "",
  page: number = 1,
  size: number = 10
): Promise<IndicesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (searchTerm) {
    params.append("q", searchTerm);
  }

  const response = await fetch(
    `${GROWW_API_BASE}/search/v3/indices/filter?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://groww.in/",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch indices: ${response.statusText}`);
  }

  return (await response.json()) as IndicesResponse;
};

/**
 * Fetch major indices (predefined list)
 * @returns Promise with array of major index data
 */
export const fetchMajorIndices = async (): Promise<IndexData[]> => {
  const majorIndices = [
    "sensex",
    "nifty",
    "banknifty",
    "finnifty",
    "midcapnifty",
  ];
  const results: IndexData[] = [];

  for (const indexKey of majorIndices) {
    const searchId = INDEX_SYMBOL_MAP[indexKey];
    if (!searchId) continue;

    try {
      const indexData = await fetchIndexDetails(searchId);
      if (indexData) {
        results.push(indexData);
      }
    } catch (error) {
      console.error(`Failed to fetch major index ${indexKey}:`, error);
    }
  }

  return results;
};

/**
 * Fetch details for a specific index by searchId
 * @param searchId - Search ID or key (e.g., "nifty" or "sp-bse-sensex")
 * @returns Promise with index data or null if not found
 */
export const fetchIndexDetails = async (
  searchId: string
): Promise<IndexData | null> => {
  // Try mapping first if it's a key like "sensex"
  const mappedSearchId = INDEX_SYMBOL_MAP[searchId.toLowerCase()] || searchId;

  const response = await fetch(`${GROWW_API_BASE}/indices/${mappedSearchId}`, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://groww.in/",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch index details for ${mappedSearchId}`);
    return null;
  }

  return (await response.json()) as IndexData;
};
