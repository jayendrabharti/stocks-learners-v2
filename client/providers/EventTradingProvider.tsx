"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useAccount } from "./AccountProvider";
import eventTradingApi from "@/services/eventTradingApi";

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
  totalPortfolioValue: number;
  totalInvestedValue: number;
  totalCurrentValue: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  totalPnLPercentage: number;
}

interface EventTradingContextType {
  positions: Position[];
  transactions: Transaction[];
  portfolio: Portfolio | null;
  refreshPositions: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  executeBuy: (params: {
    exchangeToken: string;
    qty: number;
    product: string;
    limitPrice?: number;
  }) => Promise<void>;
  executeSell: (params: {
    exchangeToken: string;
    qty: number;
    product: string;
    limitPrice?: number;
  }) => Promise<void>;
  isLoading: boolean;
}

const EventTradingContext = createContext<EventTradingContextType | undefined>(
  undefined
);

export function EventTradingProvider({
  children,
  eventId,
}: {
  children: React.ReactNode;
  eventId: string;
}) {
  const { currentAccount } = useAccount();
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPositions = useCallback(async () => {
    if (!eventId || currentAccount?.type !== "event") return;
    
    setIsLoading(true);
    try {
      const response = await eventTradingApi.getPositions(eventId);
      setPositions(response.positions);
    } catch (error) {
      console.error("Error refreshing positions:", error);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, currentAccount]);

  const refreshTransactions = useCallback(async () => {
    if (!eventId || currentAccount?.type !== "event") return;
    
    setIsLoading(true);
    try {
      const response = await eventTradingApi.getTransactions(eventId);
      setTransactions(response.transactions);
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, currentAccount]);

  const refreshPortfolio = useCallback(async () => {
    if (!eventId || currentAccount?.type !== "event") return;
    
    setIsLoading(true);
    try {
      const response = await eventTradingApi.getPortfolio(eventId);
      setPortfolio(response);
    } catch (error) {
      console.error("Error refreshing portfolio:", error);
      setPortfolio(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, currentAccount]);

  const executeBuy = useCallback(
    async (params: { exchangeToken: string; qty: number; product: string; limitPrice?: number }) => {
      if (!eventId) throw new Error("No event ID");
      
      setIsLoading(true);
      try {
        await eventTradingApi.buyOrder(eventId, params);
        await Promise.all([refreshPositions(), refreshPortfolio()]);
      } catch (error) {
        console.error("Error executing buy:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [eventId, refreshPositions, refreshPortfolio]
  );

  const executeSell = useCallback(
    async (params: { exchangeToken: string; qty: number; product: string; limitPrice?: number }) => {
      if (!eventId) throw new Error("No event ID");
      
      setIsLoading(true);
      try {
        await eventTradingApi.sellOrder(eventId, params);
        await Promise.all([refreshPositions(), refreshPortfolio()]);
      } catch (error) {
        console.error("Error executing sell:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [eventId, refreshPositions, refreshPortfolio]
  );

  return (
    <EventTradingContext.Provider
      value={{
        positions,
        transactions,
        portfolio,
        refreshPositions,
        refreshTransactions,
        refreshPortfolio,
        executeBuy,
        executeSell,
        isLoading,
      }}
    >
      {children}
    </EventTradingContext.Provider>
  );
}

export function useEventTrading() {
  const context = useContext(EventTradingContext);
  if (context === undefined) {
    throw new Error(
      "useEventTrading must be used within an EventTradingProvider"
    );
  }
  return context;
}
