export interface StockPrice {
  symbol: string;
  name?: string;
  exchange: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  previousClose?: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  sector?: string;
  industry?: string;
  lastUpdated?: Date;
}

export interface StockQuote {
  symbol: string;
  name?: string;
  exchange: string;
  isin?: string;
  companyName: string;
  industry?: string;
  sector?: string;
  marketCap?: number;
  bookValue?: number;
  dividendYield?: number;
  pe?: number;
  pb?: number;
  eps?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  priceToSales?: number;
  priceToBook?: number;
  week52High?: number;
  week52Low?: number;
  averageVolume?: number;
  beta?: number;
  faceValue?: number;
  marketLot?: number;
  listingDate?: Date;
  description?: string;
  website?: string;
  updatedAt: Date;
}

export interface InstrumentSearch {
  symbol: string; // Display name/stock name
  tradingSymbol: string; // Actual trading symbol for API calls
  name: string;
  exchange: string;
  instrumentType: string;
  isin?: string;
  sector?: string;
  industry?: string;
}

export interface SearchFilters {
  exchange?: string;
  instrumentType?: string;
  sector?: string;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  data: InstrumentSearch[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WalletData {
  id: string;
  userId: string;
  virtualCash: number;
  currency: string;
  // CNC (Delivery) metrics
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  // MIS (Intraday) metrics
  misMarginUsed: number;
  misPositionsValue: number;
  misPnL: number;
  // Performance tracking
  dayPnL: number;
  dayPnLPercent: number;
  lastUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductType = "CNC" | "MIS";

export interface BuyStockRequest {
  stockSymbol: string; // This should be the trading symbol, not the display name
  stockName: string;
  exchange: string;
  quantity: number;
  orderType: "MARKET" | "LIMIT";
  price?: number;
  isin?: string;
  product?: ProductType; // CNC (Delivery) or MIS (Intraday)
}

export interface SellStockRequest {
  stockSymbol: string;
  stockName: string;
  exchange: string;
  quantity: number;
  orderType: "MARKET" | "LIMIT";
  price?: number;
  isin?: string;
  product?: ProductType; // CNC (Delivery) or MIS (Intraday)
}

export interface TransactionData {
  id: string;
  userId: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string;
  product: ProductType; // CNC or MIS
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  totalAmount: number;
  brokerage: number;
  taxes: number;
  totalCharges: number;
  netAmount: number;
  balanceAfter: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  orderType: "MARKET" | "LIMIT";
  executedAt: Date;
  tradingOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioHolding {
  id: string;
  userId: string;
  stockSymbol: string;
  stockName: string;
  exchange: string;
  isin?: string;
  product: ProductType; // CNC (Delivery) or MIS (Intraday)
  quantity: number;
  averagePrice: number;
  totalInvested: number;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnL?: number;
  unrealizedPnLPerc?: number;
  dayChange?: number;
  dayChangePerc?: number;
  tradeDate: Date; // Important for MIS square-off tracking
  sector?: string;
  industry?: string;
  lastPriceUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
