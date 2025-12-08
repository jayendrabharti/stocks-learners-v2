"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

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

  const refreshAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch main account
      const mainAccountResponse = await fetch('/api/account', {
        credentials: 'include',
      });
      
      if (!mainAccountResponse.ok) {
        throw new Error('Failed to fetch main account');
      }
      
      const mainAccountData = await mainAccountResponse.json();
      
      // Fetch event registrations and their accounts
      const registrationsResponse = await fetch('/api/events/my-registrations', {
        credentials: 'include',
      });
      
      const registrationsData = registrationsResponse.ok 
        ? await registrationsResponse.json()
        : { registrations: [] };
      
      // Build accounts list
      const allAccounts: Account[] = [
        {
          id: 'main',
          type: 'main',
          name: 'Main Trading Account',
          cash: mainAccountData.cash || 0,
          usedMargin: mainAccountData.usedMargin || 0,
          availableMargin: mainAccountData.availableMargin || 0,
        },
        ...registrationsData.registrations
          .filter((reg: any) => reg.eventAccount)
          .map((reg: any) => ({
            id: reg.eventAccount.id,
            type: 'event' as const,
            name: reg.event.title,
            cash: reg.eventAccount.cash,
            usedMargin: reg.eventAccount.usedMargin,
            availableMargin: reg.eventAccount.cash - reg.eventAccount.usedMargin,
            eventId: reg.eventId,
            eventTitle: reg.event.title,
          })),
      ];

      setAccounts(allAccounts);
      
      // Restore from localStorage or default to main
      const savedAccountId = localStorage.getItem("currentAccountId");
      if (savedAccountId) {
        const savedAccount = allAccounts.find(acc => acc.id === savedAccountId);
        if (savedAccount) {
          setCurrentAccount(savedAccount);
          return;
        }
      }
      
      // Default to main account
      setCurrentAccount(allAccounts[0]);
    } catch (error) {
      console.error("Error refreshing accounts:", error);
      // Set default main account on error
      const defaultAccount: Account = {
        id: "main",
        type: "main",
        name: "Main Trading Account",
        cash: 0,
        usedMargin: 0,
        availableMargin: 0,
      };
      setAccounts([defaultAccount]);
      setCurrentAccount(defaultAccount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchAccount = useCallback((accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (account) {
      setCurrentAccount(account);
      localStorage.setItem("currentAccountId", accountId);
    }
  }, [accounts]);

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
