"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import ApiClient from "@/utils/ApiClient";

export type AccountType = "main" | "event";

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  cash: number;
  usedMargin: number;
  availableMargin: number;
  eventId?: string;
  eventTitle?: string;
}

interface AccountContextType {
  currentAccount: Account | null;
  accounts: Account[];
  switchAccount: (accountId: string) => void;
  refreshAccounts: () => Promise<void>;
  isLoading: boolean;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Prevent concurrent refresh calls (race condition prevention)
  const refreshInProgress = useRef(false);

  const refreshAccounts = useCallback(async () => {
    // Prevent concurrent refreshes that could cause data inconsistency
    if (refreshInProgress.current) {
      return;
    }

    refreshInProgress.current = true;
    setIsLoading(true);

    try {
      // Use ApiClient instead of fetch for proper session handling
      // ApiClient handles token refresh automatically
      const [mainAccountResponse, registrationsResponse] =
        await Promise.allSettled([
          ApiClient.get("/account"),
          ApiClient.get("/events/my-registrations"),
        ]);

      // Handle main account response
      if (mainAccountResponse.status === "rejected") {
        throw new Error("Failed to fetch main account");
      }

      const mainAccountData = mainAccountResponse.value.data;

      // Handle registrations (optional - don't fail if unavailable)
      const registrationsData =
        registrationsResponse.status === "fulfilled"
          ? registrationsResponse.value.data
          : { registrations: [] };

      // Build accounts list with explicit number parsing for safety
      const allAccounts: Account[] = [
        {
          id: "main",
          type: "main",
          name: "Main Trading Account",
          cash: Number(mainAccountData.cash) || 0,
          usedMargin: Number(mainAccountData.usedMargin) || 0,
          availableMargin: Number(mainAccountData.availableMargin) || 0,
        },
        ...registrationsData.registrations
          .filter((reg: any) => reg.eventAccount)
          .map((reg: any) => ({
            id: reg.eventAccount.id,
            type: "event" as const,
            name: reg.event.title,
            cash: Number(reg.eventAccount.cash) || 0,
            usedMargin: Number(reg.eventAccount.usedMargin) || 0,
            availableMargin:
              Number(reg.eventAccount.cash || 0) -
              Number(reg.eventAccount.usedMargin || 0),
            eventId: reg.eventId,
            eventTitle: reg.event.title,
          })),
      ];

      setAccounts(allAccounts);

      // Restore from localStorage or default to main
      const savedAccountId = localStorage.getItem("currentAccountId");
      if (savedAccountId) {
        const savedAccount = allAccounts.find(
          (acc) => acc.id === savedAccountId,
        );
        if (savedAccount) {
          setCurrentAccount(savedAccount);
          return;
        }
      }

      // Default to main account
      setCurrentAccount(allAccounts[0]);
    } catch (error: any) {
      // Check if this is an auth error (401)
      const isAuthError = error?.response?.status === 401;

      if (!isAuthError) {
        console.error("Error refreshing accounts:", error);
      }

      // For auth errors or other failures, set null to indicate unauthenticated state
      // This allows components to show appropriate login prompts
      setAccounts([]);
      setCurrentAccount(null);
    } finally {
      setIsLoading(false);
      refreshInProgress.current = false;
    }
  }, []);

  const switchAccount = useCallback(
    (accountId: string) => {
      const account = accounts.find((acc) => acc.id === accountId);
      if (account) {
        setCurrentAccount(account);
        localStorage.setItem("currentAccountId", accountId);
      }
    },
    [accounts],
  );

  // Initialize accounts on mount
  React.useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  return (
    <AccountContext.Provider
      value={{
        currentAccount,
        accounts,
        switchAccount,
        refreshAccounts,
        isLoading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
}
