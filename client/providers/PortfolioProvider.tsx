"use client";

import {
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
    if (typeof window === 'undefined') return { type: "MAIN" };
    
    try {
      const saved = localStorage.getItem('activePortfolioContext');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the saved context
        if (parsed.type === "MAIN" || (parsed.type === "EVENT" && parsed.eventId)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error loading saved context:", error);
    }
    
    return { type: "MAIN" };
  };
  
  // Context State with localStorage
  const [activeContext, setActiveContext] = useState<ActiveContext>(getInitialContext);

  // Data State
  const [account, setAccount] = useState<AccountBalance | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  const [positions, setPositions] = useState<Position[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(true);

  // Reset data when context changes
  useEffect(() => {
    if (!user) return;
    
    setAccount(null);
    setPortfolio(null);
    setPositions([]);
    setAccountLoading(true);
    setPortfolioLoading(true);
    setPositionsLoading(true);
    
    // Load data for the new context
    const loadData = async () => {
      try {
        if (activeContext.type === "MAIN") {
          const [accountData, portfolioData, positionsData] = await Promise.all([
            getAccount(),
            getPortfolio(),
            getPositions(),
          ]);
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
      } catch (error) {
        console.error("Failed to load data after context switch:", error);
      } finally {
        setAccountLoading(false);
        setPortfolioLoading(false);
        setPositionsLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext.type, activeContext.eventId]);

  const switchContext = useCallback((context: ActiveContext) => {
    setActiveContext(context);
    // Persist to localStorage
    try {
      localStorage.setItem('activePortfolioContext', JSON.stringify(context));
    } catch (error) {
      console.error("Error saving context to localStorage:", error);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!user) {
      setAccountLoading(false);
      return;
    }

    try {
      setAccountLoading(true);
      
      if (activeContext.type === "MAIN") {
        const data = await getAccount();
        setAccount(data);
      } else if (activeContext.type === "EVENT" && activeContext.eventId) {
        const data = await eventTradingApi.getPortfolio(activeContext.eventId);
        setAccount({
          totalCash: data.account.totalCash,
          usedMargin: data.account.usedMargin,
          availableMargin: data.account.availableMargin,
        });
      }
    } catch (error) {
      console.error("Failed to fetch account:", error);
    } finally {
      setAccountLoading(false);
    }
  }, [user, activeContext]);

  const refreshPortfolio = useCallback(async () => {
    if (!user) {
      setPortfolioLoading(false);
      return;
    }

    try {
      setPortfolioLoading(true);

      if (activeContext.type === "MAIN") {
        const data = await getPortfolio();
        setPortfolio(data);
      } else if (activeContext.type === "EVENT" && activeContext.eventId) {
        const data = await eventTradingApi.getPortfolio(activeContext.eventId);
        setPortfolio(data as any);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setPortfolioLoading(false);
    }
  }, [user, activeContext]);

  const refreshPositions = useCallback(async () => {
    if (!user) {
      setPositionsLoading(false);
      return;
    }

    try {
      setPositionsLoading(true);

      if (activeContext.type === "MAIN") {
        const data = await getPositions();
        setPositions(data);
      } else if (activeContext.type === "EVENT" && activeContext.eventId) {
        const data = await eventTradingApi.getPositions(activeContext.eventId);
        setPositions(data.positions as any);
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error);
    } finally {
      setPositionsLoading(false);
    }
  }, [user, activeContext]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAll();
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
