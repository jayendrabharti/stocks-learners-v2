/**
 * Account API Client
 * Handles all account-related API calls
 */

import ApiClient from "@/utils/ApiClient";
import { parseApiError } from "@/utils/apiErrors";

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
 * Helper to throw parsed errors
 */
function throwParsedError(error: unknown, fallback: string): never {
  const parsed = parseApiError(error);
  const customError = new Error(parsed.message || fallback) as Error & {
    code?: string;
  };
  customError.code = parsed.code;
  throw customError;
}

/**
 * Get user account details
 */
export async function getAccount(): Promise<AccountBalance> {
  try {
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
  } catch (error) {
    throwParsedError(error, "Failed to fetch account details");
  }
}
