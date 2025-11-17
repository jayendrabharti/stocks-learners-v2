"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { getAccount, type AccountBalance } from "@/services/accountApi";
import { getPortfolio, type Portfolio } from "@/services/portfolioApi";
import { getPositions, type Position } from "@/services/tradingApi";

interface PortfolioContextValue {
  // Account
  account: AccountBalance | null;
  accountLoading: boolean;

  // Portfolio
  portfolio: Portfolio | null;
  portfolioLoading: boolean;

  // Positions
  positions: Position[];
  positionsLoading: boolean;

  // Refresh functions
  refreshAccount: () => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountBalance | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);

  const refreshAccount = useCallback(async () => {
    try {
      setAccountLoading(true);
      const data = await getAccount();
      setAccount(data);
    } catch (error) {
      console.error("Failed to fetch account:", error);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  const refreshPortfolio = useCallback(async () => {
    try {
      setPortfolioLoading(true);
      const data = await getPortfolio();
      setPortfolio(data);
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    try {
      setPositionsLoading(true);
      const data = await getPositions();
      setPositions(data);
    } catch (error) {
      console.error("Failed to fetch positions:", error);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshAccount(),
      refreshPortfolio(),
      refreshPositions(),
    ]);
  }, [refreshAccount, refreshPortfolio, refreshPositions]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshAll, 30000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  return (
    <PortfolioContext.Provider
      value={{
        account,
        accountLoading,
        portfolio,
        portfolioLoading,
        positions,
        positionsLoading,
        refreshAccount,
        refreshPortfolio,
        refreshPositions,
        refreshAll,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within PortfolioProvider");
  }
  return context;
}
