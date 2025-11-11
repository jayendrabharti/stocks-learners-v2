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

export const formatNumber = (num: number): string => {
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
