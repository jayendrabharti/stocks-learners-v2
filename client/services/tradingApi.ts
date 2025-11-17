/**
 * Trading API Client
 * Handles all trading-related API calls (buy/sell orders)
 */

import ApiClient from "@/utils/ApiClient";

export type ProductType = "CNC" | "MIS";

export interface OrderRequest {
  exchangeToken: string;
  qty: number;
  product: ProductType;
  limitPrice?: number;
}

export interface OrderResult {
  success: boolean;
  transactionId: string;
  positionId: string;
  executedPrice: number;
  executedQty: number;
  realizedPnL?: number;
  fees: number;
  message: string;
}

/**
 * Execute a BUY order
 */
export async function executeBuyOrder(
  order: OrderRequest,
): Promise<OrderResult> {
  const response = await ApiClient.post<OrderResult>("/trading/buy", order);

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to execute buy order");
  }

  return response.data;
}

/**
 * Execute a SELL order
 */
export async function executeSellOrder(
  order: OrderRequest,
): Promise<OrderResult> {
  const response = await ApiClient.post<OrderResult>("/trading/sell", order);

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to execute sell order");
  }

  return response.data;
}

export interface Position {
  id: string;
  instrument: {
    id: string;
    tradingSymbol: string;
    name: string | null;
    type: string;
    exchange: string;
    segment: string;
  };
  product: ProductType;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  lots: any[];
  recentTransactions: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PositionsResponse {
  success: boolean;
  positions: Position[];
  count: number;
}

/**
 * Get all user positions
 */
export async function getPositions(product?: ProductType): Promise<Position[]> {
  const params = product ? { product } : {};
  const response = await ApiClient.get<PositionsResponse>(
    "/trading/positions",
    {
      params,
    },
  );

  if (!response.data.success) {
    throw new Error("Failed to fetch positions");
  }

  return response.data.positions;
}
