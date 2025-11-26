/**
 * Portfolio API Client
 * Handles portfolio summary and holdings API calls
 */

import ApiClient from "@/utils/ApiClient";
import type { ProductType } from "./tradingApi";

export interface Holding {
  positionId: string;
  product: "CNC" | "MIS";
  instrument: {
    id: string;
    tradingSymbol: string;
    name: string | null;
    exchange: string;
    type: string;
    segment: string;
    searchId: string | null;
  };
  qty: number;
  avgPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  pnlPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  lots?: Array<{
    id: string;
    totalQty: number;
    remainingQty: number;
    buyPrice: number;
    unrealizedPnL: number;
    createdAt: string;
  }>;
}

export interface HoldingsByProduct {
  positions: Holding[];
  count: number;
  totalValue: number;
  totalPnL: number;
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
  totalRealizedPnLAllTime: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  totalPnLPercentage: number;
  totalFeesPaid: number;
  totalFeesInOpenPositions: number;
  holdings: {
    CNC: HoldingsByProduct;
    MIS: HoldingsByProduct;
  };
  stats: {
    totalPositions: number;
    profitablePositions: number;
    lossPositions: number;
  };
}

export interface PortfolioResponse {
  success: boolean;
  portfolio: Portfolio;
}

/**
 * Get complete portfolio summary
 */
export async function getPortfolio(): Promise<Portfolio> {
  const response = await ApiClient.get<PortfolioResponse>("/portfolio");

  if (!response.data.success) {
    throw new Error("Failed to fetch portfolio");
  }

  return response.data.portfolio;
}
