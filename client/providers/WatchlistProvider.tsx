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
import { useRouter, usePathname, useSearchParams } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    if (!isAuthenticated) {
      const redirect = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      toast.error("Please log in to save to watchlist", {
        action: {
          label: "Login",
          onClick: () =>
            router.push(`/login?redirect=${encodeURIComponent(redirect)}`),
        },
      });
      return;
    }

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
      const status = (error as any)?.response?.status;
      const redirect = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

      if (status === 401) {
        toast.error("Please log in to save to watchlist", {
          action: {
            label: "Login",
            onClick: () =>
              router.push(`/login?redirect=${encodeURIComponent(redirect)}`),
          },
        });
      } else {
        toast.error("Error adding watchlist item", {
          description: getErrorMessage(error),
        });
      }
    }
  };

  const removeWatchlistItem = async (id: string) => {
    if (!isAuthenticated) {
      const redirect = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      toast.error("Please log in to manage your watchlist", {
        action: {
          label: "Login",
          onClick: () =>
            router.push(`/login?redirect=${encodeURIComponent(redirect)}`),
        },
      });
      return;
    }

    try {
      await ApiClient.delete(`/watchlist?id=${id}`).then((response) => {
        if (response.data.success) {
          setWatchlistItems((prevItems) =>
            prevItems ? prevItems.filter((item) => item.id !== id) : null,
          );
        }
      });
    } catch (error) {
      const status = (error as any)?.response?.status;
      const redirect = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

      if (status === 401) {
        toast.error("Please log in to manage your watchlist", {
          action: {
            label: "Login",
            onClick: () =>
              router.push(`/login?redirect=${encodeURIComponent(redirect)}`),
          },
        });
      } else {
        toast.error("Couldn't remove from watchlist. Please try again.", {
          description: getErrorMessage(error),
        });
      }
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
