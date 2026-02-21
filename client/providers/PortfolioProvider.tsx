"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "@/providers/SessionProvider";
import { getAccount, type AccountBalance } from "@/services/accountApi";
import { getPortfolio, type Portfolio } from "@/services/portfolioApi";
import { getPositions, type Position } from "@/services/tradingApi";
import eventTradingApi from "@/services/eventTradingApi";

export type PortfolioContextType = "MAIN" | "EVENT";

export interface ActiveContext {
  type: PortfolioContextType;
  eventId?: string;
  eventSlug?: string;
  eventTitle?: string;
}

interface PortfolioContextValue {
  // Context Switching
  activeContext: ActiveContext;
  switchContext: (context: ActiveContext) => void;

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
  const { user } = useSession();

  // Load initial context from localStorage
  const getInitialContext = (): ActiveContext => {
    if (typeof window === "undefined") return { type: "MAIN" };

    try {
      const saved = localStorage.getItem("activePortfolioContext");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the saved context
        if (
          parsed.type === "MAIN" ||
          (parsed.type === "EVENT" && parsed.eventId)
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading saved context:", error);
    }

    return { type: "MAIN" };
  };

  // Context State with localStorage
  const [activeContext, setActiveContext] =
    useState<ActiveContext>(getInitialContext);

  // Data State
  const [account, setAccount] = useState<AccountBalance | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);

  // Track if this is the first load vs a context switch
  const isInitialLoadRef = React.useRef(true);

  // Load data when context changes or user authenticates
  useEffect(() => {
    if (!user) return;

    // Only reset to null on actual context switches (not initial load)
    // This prevents the brief skeleton flash on first page visit
    if (!isInitialLoadRef.current) {
      setAccount(null);
      setPortfolio(null);
      setPositions([]);
    }
    isInitialLoadRef.current = false;

    setAccountLoading(true);
    setPortfolioLoading(true);
    setPositionsLoading(true);

    // Load data for the current context
    const loadData = async () => {
      try {
        if (activeContext.type === "MAIN") {
          const [accountData, portfolioData, positionsData] = await Promise.all(
            [getAccount(), getPortfolio(), getPositions()],
          );
          setAccount(accountData);
          setPortfolio(portfolioData);
          setPositions(positionsData);
        } else if (activeContext.type === "EVENT" && activeContext.eventId) {
          const [portfolioData, positionsData] = await Promise.all([
            eventTradingApi.getPortfolio(activeContext.eventId),
            eventTradingApi.getPositions(activeContext.eventId),
          ]);
          setAccount({
            totalCash: portfolioData.account.totalCash,
            usedMargin: portfolioData.account.usedMargin,
            availableMargin: portfolioData.account.availableMargin,
          });
          setPortfolio(portfolioData as any);
          setPositions(positionsData.positions as any);
        }
      } catch (error: any) {
        // Only log non-auth errors to avoid noise
        const isAuthError = error?.response?.status === 401;
        if (!isAuthError) {
          console.error("Failed to load data after context switch:", error);
        }
        // Data stays in reset state (null/empty) which components can handle gracefully
      } finally {
        setAccountLoading(false);
        setPortfolioLoading(false);
        setPositionsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeContext.type, activeContext.eventId]);

  const switchContext = useCallback((context: ActiveContext) => {
    setActiveContext(context);
    // Persist to localStorage
    try {
      localStorage.setItem("activePortfolioContext", JSON.stringify(context));
    } catch (error) {
      console.error("Error saving context to localStorage:", error);
    }
  }, []);

  const refreshAccount = useCallback(
    async (showLoading = true) => {
      if (!user) {
        setAccountLoading(false);
        return;
      }

      try {
        if (showLoading) setAccountLoading(true);

        if (activeContext.type === "MAIN") {
          const data = await getAccount();
          setAccount(data);
        } else if (activeContext.type === "EVENT" && activeContext.eventId) {
          const data = await eventTradingApi.getPortfolio(
            activeContext.eventId,
          );
          setAccount({
            totalCash: data.account.totalCash,
            usedMargin: data.account.usedMargin,
            availableMargin: data.account.availableMargin,
          });
        }
      } catch (error: any) {
        // Silent fail for auth errors - components will show login prompt
        const isAuthError = error?.response?.status === 401;
        if (!isAuthError) {
          console.error("Failed to fetch account:", error);
        }
      } finally {
        if (showLoading) setAccountLoading(false);
      }
    },
    [user, activeContext],
  );

  const refreshPortfolio = useCallback(
    async (showLoading = true) => {
      if (!user) {
        setPortfolioLoading(false);
        return;
      }

      try {
        if (showLoading) setPortfolioLoading(true);

        if (activeContext.type === "MAIN") {
          const data = await getPortfolio();
          setPortfolio(data);
        } else if (activeContext.type === "EVENT" && activeContext.eventId) {
          const data = await eventTradingApi.getPortfolio(
            activeContext.eventId,
          );
          setPortfolio(data as any);
        }
      } catch (error: any) {
        // Silent fail for auth errors - components will show login prompt
        const isAuthError = error?.response?.status === 401;
        if (!isAuthError) {
          console.error("Failed to fetch portfolio:", error);
        }
      } finally {
        if (showLoading) setPortfolioLoading(false);
      }
    },
    [user, activeContext],
  );

  const refreshPositions = useCallback(
    async (showLoading = true) => {
      if (!user) {
        setPositionsLoading(false);
        return;
      }

      try {
        if (showLoading) setPositionsLoading(true);

        if (activeContext.type === "MAIN") {
          const data = await getPositions();
          setPositions(data);
        } else if (activeContext.type === "EVENT" && activeContext.eventId) {
          const data = await eventTradingApi.getPositions(
            activeContext.eventId,
          );
          setPositions(data.positions as any);
        }
      } catch (error: any) {
        // Silent fail for auth errors - components will show login prompt
        const isAuthError = error?.response?.status === 401;
        if (!isAuthError) {
          console.error("Failed to fetch positions:", error);
        }
      } finally {
        if (showLoading) setPositionsLoading(false);
      }
    },
    [user, activeContext],
  );

  const refreshAll = useCallback(
    async (showLoading = true) => {
      await Promise.all([
        refreshAccount(showLoading),
        refreshPortfolio(showLoading),
        refreshPositions(showLoading),
      ]);
    },
    [refreshAccount, refreshPortfolio, refreshPositions],
  );

  // Auto-refresh every 30 seconds (silent — no skeleton flash)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll(false);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshAll]);

  return (
    <PortfolioContext.Provider
      value={{
        activeContext,
        switchContext,
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
