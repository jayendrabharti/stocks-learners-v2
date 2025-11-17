/**
 * Account API Client
 * Handles all account-related API calls
 */

import ApiClient from "@/utils/ApiClient";

export interface AccountBalance {
  cash: number;
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
  const response = await ApiClient.get<AccountResponse>("/account");

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch account");
  }

  return response.data.account;
}

/**
 * Deposit funds (manual - for testing)
 */
export async function depositFunds(amount: number): Promise<AccountBalance> {
  const response = await ApiClient.post<AccountResponse>("/account/deposit", {
    amount,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to deposit funds");
  }

  return response.data.account;
}

/**
 * Withdraw funds (manual - for testing)
 */
export async function withdrawFunds(amount: number): Promise<AccountBalance> {
  const response = await ApiClient.post<AccountResponse>("/account/withdraw", {
    amount,
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to withdraw funds");
  }

  return response.data.account;
}
