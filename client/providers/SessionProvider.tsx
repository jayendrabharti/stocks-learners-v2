"use client";

import getUser from "@/auth/getUser";
import ApiClient from "@/utils/ApiClient";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  SetStateAction,
  Dispatch,
  useRef,
} from "react";
import { toast } from "sonner";
import { checkStaleMIS, processAutoSquareOff } from "@/services/tradingApi";

export interface SessionContextType {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  refreshSession: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
  logOut: (redirect?: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  status: "loading",
  error: null,
  refreshSession: async () => {},
  setUser: () => {},
  logOut: async (redirect: boolean = false) => {},
});

export default function SessionProvider({ children }: { children: ReactNode }) {
  // NO localStorage - always fetch from backend
  const [user, setUser] = useState<SessionContextType["user"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionContextType["status"]>("loading");

  const router = useRouter();

  // Track if we've already checked for stale MIS in this session
  const hasCheckedStaleMIS = useRef(false);
  const isFetchingSession = useRef(false);

  // Clean up any old localStorage user data on mount (one-time migration)
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      console.log("[SessionProvider] Cleaned up old localStorage user data");
    }
  }, []);

  const fetchSession = async () => {
    // Prevent concurrent fetches
    if (isFetchingSession.current) {
      console.log("[SessionProvider] Already fetching session, skipping...");
      return;
    }

    isFetchingSession.current = true;
    console.log("[SessionProvider] Fetching session from backend...");

    try {
      const fetchedUser = await getUser();

      if (fetchedUser) {
        // User is valid, update state (NO localStorage)
        setUser(fetchedUser);
        setStatus("authenticated");
        console.log("[SessionProvider] User authenticated:", fetchedUser.email);

        // Check for stale MIS positions on first authentication
        // This runs once per session when user is authenticated
        if (!hasCheckedStaleMIS.current) {
          hasCheckedStaleMIS.current = true;
          checkAndAutoSquareOff();
        }
      } else {
        // User session is invalid, clear everything
        setUser(null);
        setStatus("unauthenticated");
        hasCheckedStaleMIS.current = false; // Reset for next login
        console.log("[SessionProvider] User session invalid, cleared");
      }
      setError(null);
    } catch (error) {
      console.error("[SessionProvider] Failed to fetch session:", error);
      setError("Failed to fetch session");
      // On error, clear user data to be safe
      setUser(null);
      setStatus("unauthenticated");
      hasCheckedStaleMIS.current = false;
    } finally {
      isFetchingSession.current = false;
      console.log("[SessionProvider] Fetch session complete");
    }
  };

  /**
   * Check for stale MIS positions and auto square-off
   * This mimics how Groww/Zerodha handle MIS positions:
   * - Checks if user has MIS positions from previous trading days
   * - Automatically squares them off at historical closing prices (3:30 PM)
   * - Shows notification with details
   *
   * Runs automatically on login/session init (once per session)
   */
  const checkAndAutoSquareOff = async () => {
    try {
      // Quick check if user has stale positions (lightweight API call)
      const { hasStaleMIS } = await checkStaleMIS();

      if (!hasStaleMIS) {
        // No stale positions, nothing to do
        return;
      }

      // User has stale MIS positions, process auto square-off
      console.log(
        "[AutoSquareOff] Stale MIS positions detected, processing...",
      );

      const result = await processAutoSquareOff();

      if (result.squaredOffCount > 0) {
        // Calculate total P&L
        const totalPnL = result.positions.reduce(
          (sum, pos) => sum + pos.pnl,
          0,
        );
        const avgPnLPercent =
          result.positions.reduce((sum, pos) => sum + pos.pnlPercent, 0) /
          result.positions.length;

        // Show notification with summary
        const pnlColor = totalPnL >= 0 ? "text-green-600" : "text-red-600";
        const pnlSign = totalPnL >= 0 ? "+" : "";

        toast.success(
          <div className="space-y-2">
            <div className="font-semibold">Auto Square-Off Completed</div>
            <div className="text-sm">
              {result.squaredOffCount} MIS position(s) from previous trading
              day(s) were automatically squared off at market close prices (3:30
              PM).
            </div>
            <div className={`text-sm font-semibold ${pnlColor}`}>
              Total P&L: {pnlSign}₹{Math.abs(totalPnL).toFixed(2)} ({pnlSign}
              {avgPnLPercent.toFixed(2)}%)
            </div>
            <div className="text-muted-foreground mt-1 text-xs">
              View details in your transaction history
            </div>
          </div>,
          {
            duration: 8000, // Show for 8 seconds
            position: "top-center",
          },
        );

        console.log(
          `[AutoSquareOff] Successfully squared off ${result.squaredOffCount} position(s)`,
        );
      }

      // Log any errors
      if (result.errors && result.errors.length > 0) {
        console.warn(
          "[AutoSquareOff] Some positions failed to square off:",
          result.errors,
        );

        toast.warning(
          `${result.errors.length} position(s) could not be squared off automatically. Please check manually.`,
          { duration: 6000 },
        );
      }
    } catch (error) {
      console.error(
        "[AutoSquareOff] Error checking/processing stale MIS:",
        error,
      );
      // Don't show error toast to user - this is a background operation
      // User can manually check their portfolio if needed
    }
  };

  const logOut = async (redirect: boolean = false) => {
    try {
      const { data } = await ApiClient.post("/auth/logout");
      if (data.success) {
        // Clear all user data immediately (NO localStorage)
        setUser(null);
        setError(null);
        setStatus("unauthenticated");
        hasCheckedStaleMIS.current = false; // Reset for next login
        toast.success("Signed out !!");
        if (redirect) {
          router.push("/login");
        }
      } else {
        toast.error("Error signing out");
      }
    } catch (error) {
      // Even if API call fails, clear local session
      setUser(null);
      setError(null);
      setStatus("unauthenticated");
      hasCheckedStaleMIS.current = false;
      toast.error("Error signing out, but local session cleared");
      if (redirect) {
        router.push("/login");
      }
    }
  };

  // Simple setUser - NO localStorage sync needed
  const updateUser = (value: SetStateAction<User | null>) => {
    const newUser = typeof value === "function" ? value(user) : value;
    setUser(newUser);
  };

  useEffect(() => {
    // Only fetch session once on mount
    // Don't refetch if user changes (would cause loops)
    fetchSession();
  }, []); // Keep empty dependency array - only run on mount

  const contextValue: SessionContextType = {
    user,
    status,
    error,
    refreshSession: fetchSession,
    setUser: updateUser,
    logOut,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
