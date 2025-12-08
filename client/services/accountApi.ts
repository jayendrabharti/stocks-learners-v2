/**
 * Account API Client
 * Handles all account-related API calls
 */

import ApiClient from "@/utils/ApiClient";

export interface AccountBalance {
  totalCash: number;
  usedMargin: number;
  availableMargin: number;
}

export interface AccountResponse {
  success: boolean;
  account: AccountBalance;
  message?: string;
}

/**
 * Get user account details
 */
export async function getAccount(): Promise<AccountBalance> {
  const response = await ApiClient.get<any>("/account");

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch account");
  }

  // Map backend 'cash' to 'totalCash'
  const account = response.data.account;
  return {
    totalCash: account.cash,
    usedMargin: account.usedMargin,
    availableMargin: account.availableMargin,
  };
}

/**
 * Deposit funds (manual - for testing)
 */
export async function depositFunds(amount: number): Promise<AccountBalance> {
  const response = await ApiClient.post<any>("/account/deposit", {
    amount,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to deposit funds");
  }

  const account = response.data.account;
  return {
    totalCash: account.cash,
    usedMargin: account.usedMargin,
    availableMargin: account.availableMargin,
  };
}

/**
 * Withdraw funds (manual - for testing)
 */
export async function withdrawFunds(amount: number): Promise<AccountBalance> {
  const response = await ApiClient.post<any>("/account/withdraw", {
    amount,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to withdraw funds");
  }

  const account = response.data.account;
  return {
    totalCash: account.cash,
    usedMargin: account.usedMargin,
    availableMargin: account.availableMargin,
  };
}
