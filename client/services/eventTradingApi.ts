/**
 * Event Trading API Service
 * Client-side API calls for event trading operations
 */

import ApiClient from "@/utils/ApiClient";

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Position {
  id: string;
  instrumentId: string;
  product: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
}

export interface Transaction {
  id: string;
  instrumentId: string;
  side: string;
  product: string;
  qty: number;
  price: number;
  fees: number;
  realizedPnl: number;
  createdAt: string;
}

export interface Portfolio {
  account: {
    totalCash: number;
    usedMargin: number;
    availableMargin: number;
  };
  totalPortfolioValue: number;
  totalInvestedValue: number;
  totalCurrentValue: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  totalPnLPercentage: number;
  holdings: {
    CNC: {
      positions: Position[];
      count: number;
      totalValue: number;
      totalPnL: number;
    };
    MIS: {
      positions: Position[];
      count: number;
      totalValue: number;
      totalPnL: number;
    };
  };
}

/**
 * Execute buy order in event
 */
export async function buyOrder(
  eventId: string,
  params: {
    exchangeToken: string;
    qty: number;
    product: string;
    limitPrice?: number;
  },
): Promise<{
  success: boolean;
  transactionId: string;
  positionId: string;
  executedPrice: number;
  executedQty: number;
  fees: number;
  message: string;
}> {
  const response = await ApiClient.post(
    `/events/${eventId}/trading/buy`,
    params,
  );
  return response.data;
}

/**
 * Execute sell order in event
 */
export async function sellOrder(
  eventId: string,
  params: {
    exchangeToken: string;
    qty: number;
    product: string;
    limitPrice?: number;
  },
): Promise<{
  success: boolean;
  transactionId: string;
  positionId: string;
  executedPrice: number;
  executedQty: number;
  realizedPnL: number;
  fees: number;
  message: string;
}> {
  const response = await ApiClient.post(
    `/events/${eventId}/trading/sell`,
    params,
  );
  return response.data;
}

/**
 * Get event positions
 */
export async function getPositions(
  eventId: string,
  product?: string,
): Promise<{ positions: Position[] }> {
  const response = await ApiClient.get(`/events/${eventId}/trading/positions`, {
    params: { product },
  });
  return response.data;
}

/**
 * Get event transactions
 */
export async function getTransactions(
  eventId: string,
  page?: number,
  limit?: number,
): Promise<{ transactions: Transaction[]; pagination: Pagination }> {
  const response = await ApiClient.get(
    `/events/${eventId}/trading/transactions`,
    {
      params: { page, limit },
    },
  );
  return response.data;
}

/**
 * Get event portfolio
 */
export async function getPortfolio(eventId: string): Promise<Portfolio> {
  const response = await ApiClient.get(`/events/${eventId}/portfolio`);
  return response.data;
}

const eventTradingApi = {
  buyOrder,
  sellOrder,
  getPositions,
  getTransactions,
  getPortfolio,
};

export default eventTradingApi;
