import ApiClient from "@/utils/ApiClient";

// Backend API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

// Types for Stock data
export interface Stock {
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

// Type for Most Bought stocks
export interface MostBoughtStock {
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

// Market mover types
export type MoverType = "gainers" | "losers" | "volume";

// Market timing types
export interface MarketTiming {
  marketCloseTime: string;
  marketOpenTime: string;
  marketPreCloseTime: string;
  marketPreOpenCloseTime: string;
  marketPreOpenTime: string;
}

export interface MarketTimingResponse {
  dateMarketTimeMap: {
    [date: string]: MarketTiming;
  };
}

export interface MarketStatus {
  isOpen: boolean;
  nextOpenTime?: string;
  nextCloseTime?: string;
}

// F&O types
export interface FnOUnderlying {
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

export interface FnOContract {
  searchId: string;
  companyName: string;
  contractType: string;
  expiryDate: string;
  strikePrice?: number;
  ltp: number;
  dayChangePerc: number;
  oi: number;
  volume: number;
}

// Indices types
export interface IndexHeader {
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

export interface IndexData {
  header: IndexHeader;
  yearLowPrice?: number;
  yearHighPrice?: number;
}

export interface IndicesResponse {
  allAssets: IndexData[];
}

export const marketApi = {
  /**
   * Get most bought stocks on Groww
   * @param size Number of stocks to fetch (default: 10)
   */
  getMostBought: async (size: number = 10): Promise<MostBoughtStock[]> => {
    const response = await ApiClient.get<ApiResponse<MostBoughtStock[]>>(
      `/market/most-bought?size=${size}`,
    );
    return response.data.data;
  },

  /**
   * Get top market movers
   * @param type Type of movers: 'gainers', 'losers', or 'volume'
   * @param pageSize Number of stocks to fetch (default: 10)
   */
  getTopMovers: async (
    type: MoverType,
    pageSize: number = 10,
  ): Promise<Stock[]> => {
    const response = await ApiClient.get<ApiResponse<Stock[]>>(
      `/market/top-movers?type=${type}&pageSize=${pageSize}`,
    );
    return response.data.data;
  },

  /**
   * Get market timing information
   */
  getMarketTiming: async (): Promise<MarketTimingResponse> => {
    const response =
      await ApiClient.get<ApiResponse<MarketTimingResponse>>(`/market/timing`);
    return response.data.data;
  },

  /**
   * Get current market status (open/closed)
   */
  getMarketStatus: async (): Promise<MarketStatus> => {
    const response =
      await ApiClient.get<ApiResponse<MarketStatus>>(`/market/status`);
    return response.data.data;
  },

  /**
   * Get top traded F&O underlyings
   * @param limit Number of underlyings to fetch (default: 6)
   */
  getFnOTopUnderlyings: async (limit: number = 6): Promise<FnOUnderlying[]> => {
    const response = await ApiClient.get<ApiResponse<FnOUnderlying[]>>(
      `/market/fno/top-underlyings?limit=${limit}`,
    );
    return response.data.data;
  },

  /**
   * Get F&O market trends for a specific instrument
   */
  getFnOMarketTrends: async (
    instrument: string,
    options?: {
      exchange?: string;
      interval?: string;
      limit?: number;
      marketTrendFactor?: string;
      type?: string;
    },
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (options?.exchange) params.append("exchange", options.exchange);
    if (options?.interval) params.append("interval", options.interval);
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.marketTrendFactor)
      params.append("marketTrendFactor", options.marketTrendFactor);
    if (options?.type) params.append("type", options.type);

    const queryString = params.toString();
    const url = `/market/fno/trends/${instrument}${queryString ? `?${queryString}` : ""}`;

    const response = await ApiClient.get<ApiResponse<any>>(url);
    return response.data.data;
  },

  /**
   * Get top traded F&O contracts
   */
  getFnOTopContracts: async (options?: {
    exchange?: string;
    instruments?: string;
    limit?: number;
  }): Promise<FnOContract[]> => {
    const params = new URLSearchParams();
    if (options?.exchange) params.append("exchange", options.exchange);
    if (options?.instruments) params.append("instruments", options.instruments);
    if (options?.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString();
    const url = `/market/fno/top-contracts${queryString ? `?${queryString}` : ""}`;

    const response = await ApiClient.get<ApiResponse<FnOContract[]>>(url);
    return response.data.data;
  },

  /**
   * Get indices by search term
   * @param searchTerm Search term to filter indices
   * @param page Page number (default: 1)
   * @param size Number of results per page (default: 10)
   */
  getIndices: async (
    searchTerm: string = "",
    page: number = 1,
    size: number = 10,
  ): Promise<IndicesResponse> => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("q", searchTerm);
    params.append("page", page.toString());
    params.append("size", size.toString());

    const queryString = params.toString();
    const url = `/market/indices${queryString ? `?${queryString}` : ""}`;

    const response = await ApiClient.get<ApiResponse<IndicesResponse>>(url);
    return response.data.data;
  },

  /**
   * Get major indices (predefined list)
   */
  getMajorIndices: async (): Promise<IndexData[]> => {
    const response = await ApiClient.get<ApiResponse<IndexData[]>>(
      `/market/indices/major`,
    );
    return response.data.data;
  },

  /**
   * Get specific index details
   * @param searchId Search ID or key (e.g., "nifty" or "sp-bse-sensex")
   */
  getIndexDetails: async (searchId: string): Promise<IndexData> => {
    const response = await ApiClient.get<ApiResponse<IndexData>>(
      `/market/indices/${searchId}`,
    );
    return response.data.data;
  },
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return "N/A";
  }
  if (num >= 10000000) {
    return `${(num / 10000000).toFixed(2)}Cr`;
  } else if (num >= 100000) {
    return `${(num / 100000).toFixed(2)}L`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toFixed(2);
};

export const calculateChangePercent = (
  current: number,
  previous: number,
): number => {
  return ((current - previous) / previous) * 100;
};
