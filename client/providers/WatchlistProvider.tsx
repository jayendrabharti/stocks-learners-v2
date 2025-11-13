"use client";
import ApiClient from "@/utils/ApiClient";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
  useTransition,
} from "react";
import { useSession } from "./SessionProvider";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils";

type WatchlistContextType = {
  watchlistItems: WatchlistItem[] | null;
  setWatchlistItems: Dispatch<SetStateAction<WatchlistItem[] | null>>;
  loading: boolean;
  error: string | null;
  addWatchlistItem: ({
    instrumentType,
    searchId,
    tradingSymbol,
  }: {
    instrumentType: InstrumentType;
    searchId: string;
    tradingSymbol?: string;
  }) => Promise<void>;
  removeWatchlistItem: (id: string) => Promise<void>;
};

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined,
);

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useSession();

  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[] | null>(
    null,
  );
  const [loading, startLoading] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startLoading(async () => {
      if (!isAuthenticated) {
        setError("User not authenticated");
        return;
      }

      await ApiClient.get("/watchlist")
        .then((response) => {
          setWatchlistItems(response.data.watchlistItems);
        })
        .catch(() => {
          setError("Error fetching watchlist");
        });
    });
  }, [isAuthenticated]);

  const addWatchlistItem = async ({
    instrumentType,
    searchId,
    tradingSymbol,
  }: {
    instrumentType: InstrumentType;
    searchId: string;
    tradingSymbol?: string;
  }) => {
    try {
      await ApiClient.post("/watchlist", {
        searchId,
        tradingSymbol,
        instrumentType,
      }).then((response) => {
        setWatchlistItems((prevItems) => {
          if (prevItems) {
            return [...prevItems, response.data.newWatchlistItem];
          }
          return [response.data.newWatchlistItem];
        });
      });
    } catch (error) {
      toast.error("Error adding watchlist item", {
        description: getErrorMessage(error),
      });
    }
  };

  const removeWatchlistItem = async (id: string) => {
    try {
      await ApiClient.delete(`/watchlist?id=${id}`).then((response) => {
        if (response.data.success) {
          setWatchlistItems((prevItems) =>
            prevItems ? prevItems.filter((item) => item.id !== id) : null,
          );
        }
      });
    } catch (error) {
      toast.error("Error removing watchlist item", {
        description: getErrorMessage(error),
      });
    }
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlistItems,
        setWatchlistItems,
        loading,
        error,
        addWatchlistItem,
        removeWatchlistItem,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
};
