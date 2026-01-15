/**
 * API Error Handling Utilities
 * Standardized error extraction and display for frontend
 */

import { AxiosError } from "axios";

/**
 * Error codes from the backend
 */
export type ErrorCode =
  | "AUTH_UNAUTHORIZED"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_USER_NOT_FOUND"
  | "AUTH_ADMIN_REQUIRED"
  | "VALIDATION_REQUIRED_FIELD"
  | "VALIDATION_INVALID_FORMAT"
  | "VALIDATION_INVALID_VALUE"
  | "VALIDATION_OUT_OF_RANGE"
  | "TRADING_MARKET_CLOSED"
  | "TRADING_INSUFFICIENT_FUNDS"
  | "TRADING_INSUFFICIENT_MARGIN"
  | "TRADING_INSUFFICIENT_QUANTITY"
  | "TRADING_INVALID_QUANTITY"
  | "TRADING_INVALID_LOT_SIZE"
  | "TRADING_INVALID_TICK_SIZE"
  | "TRADING_FREEZE_LIMIT_EXCEEDED"
  | "TRADING_BUY_NOT_ALLOWED"
  | "TRADING_SELL_NOT_ALLOWED"
  | "TRADING_INSTRUMENT_RESERVED"
  | "TRADING_ORDER_FAILED"
  | "TRADING_PRICE_FETCH_FAILED"
  | "POSITION_NOT_FOUND"
  | "POSITION_ALREADY_CLOSED"
  | "POSITION_SQUARE_OFF_FAILED"
  | "INSTRUMENT_NOT_FOUND"
  | "INSTRUMENT_NOT_TRADEABLE"
  | "INSTRUMENT_EXPIRED"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_INSUFFICIENT_BALANCE"
  | "ACCOUNT_WITHDRAWAL_EXCEEDS_BALANCE"
  | "PAYMENT_FAILED"
  | "PAYMENT_VERIFICATION_FAILED"
  | "PAYMENT_ALREADY_PROCESSED"
  | "EVENT_NOT_FOUND"
  | "EVENT_NOT_ACTIVE"
  | "EVENT_REGISTRATION_CLOSED"
  | "EVENT_ALREADY_REGISTERED"
  | "EVENT_NOT_REGISTERED"
  | "EVENT_NOT_STARTED"
  | "EVENT_ENDED"
  | "RESOURCE_NOT_FOUND"
  | "RESOURCE_ALREADY_EXISTS"
  | "SERVER_ERROR"
  | "SERVER_DATABASE_ERROR"
  | "SERVER_EXTERNAL_API_ERROR"
  | "SERVER_RATE_LIMITED"
  | string;

/**
 * Structured error from backend API
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  action?: {
    label: string;
    href?: string;
  };
}

/**
 * Parsed error result
 */
export interface ParsedError {
  code: ErrorCode;
  message: string;
  action?: {
    label: string;
    href?: string;
  };
  isNetworkError: boolean;
  isServerError: boolean;
  isAuthError: boolean;
  statusCode?: number;
}

/**
 * Default error messages for common scenarios
 */
const DEFAULT_MESSAGES: Record<string, string> = {
  network:
    "Unable to connect to server. Please check your internet connection.",
  timeout: "Request timed out. Please try again.",
  server: "Something went wrong on our end. Please try again later.",
  unknown: "An unexpected error occurred. Please try again.",
};

/**
 * Extract error information from various error formats
 */
export function parseApiError(error: unknown): ParsedError {
  // Handle Axios errors
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      error?: ApiError;
      message?: string;
    }>;
    const statusCode = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    // Network error (no response)
    if (!axiosError.response) {
      return {
        code: "NETWORK_ERROR",
        message:
          axiosError.message === "Network Error"
            ? DEFAULT_MESSAGES.network
            : axiosError.message || DEFAULT_MESSAGES.network,
        isNetworkError: true,
        isServerError: false,
        isAuthError: false,
      };
    }

    // Timeout
    if (axiosError.code === "ECONNABORTED") {
      return {
        code: "TIMEOUT",
        message: DEFAULT_MESSAGES.timeout,
        isNetworkError: true,
        isServerError: false,
        isAuthError: false,
      };
    }

    // Structured error response
    if (responseData?.error) {
      const apiError = responseData.error;
      return {
        code: apiError.code || "UNKNOWN_ERROR",
        message: apiError.message || DEFAULT_MESSAGES.unknown,
        action: apiError.action,
        isNetworkError: false,
        isServerError: statusCode ? statusCode >= 500 : false,
        isAuthError: statusCode === 401 || statusCode === 403,
        statusCode,
      };
    }

    // Simple message response
    if (responseData?.message) {
      return {
        code: getCodeFromStatus(statusCode),
        message: responseData.message,
        isNetworkError: false,
        isServerError: statusCode ? statusCode >= 500 : false,
        isAuthError: statusCode === 401 || statusCode === 403,
        statusCode,
      };
    }

    // HTTP status based fallback
    return {
      code: getCodeFromStatus(statusCode),
      message: getMessageFromStatus(statusCode),
      isNetworkError: false,
      isServerError: statusCode ? statusCode >= 500 : false,
      isAuthError: statusCode === 401 || statusCode === 403,
      statusCode,
    };
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    return {
      code: "CLIENT_ERROR",
      message: error.message || DEFAULT_MESSAGES.unknown,
      isNetworkError: false,
      isServerError: false,
      isAuthError: false,
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return {
      code: "CLIENT_ERROR",
      message: error,
      isNetworkError: false,
      isServerError: false,
      isAuthError: false,
    };
  }

  // Unknown error type
  return {
    code: "UNKNOWN_ERROR",
    message: DEFAULT_MESSAGES.unknown,
    isNetworkError: false,
    isServerError: false,
    isAuthError: false,
  };
}

/**
 * Get a user-friendly error message from an error
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const parsed = parseApiError(error);
  return parsed.message || fallback || DEFAULT_MESSAGES.unknown;
}

/**
 * Get error code from an error
 */
export function getErrorCode(error: unknown): ErrorCode {
  const parsed = parseApiError(error);
  return parsed.code;
}

/**
 * Check if error requires user to add funds
 */
export function isInsufficientFundsError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return (
    parsed.code === "TRADING_INSUFFICIENT_FUNDS" ||
    parsed.code === "TRADING_INSUFFICIENT_MARGIN" ||
    parsed.code === "ACCOUNT_INSUFFICIENT_BALANCE" ||
    parsed.message.toLowerCase().includes("insufficient funds") ||
    parsed.message.toLowerCase().includes("insufficient margin")
  );
}

/**
 * Check if error is due to market being closed
 */
export function isMarketClosedError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return (
    parsed.code === "TRADING_MARKET_CLOSED" ||
    (parsed.message.toLowerCase().includes("market") &&
      parsed.message.toLowerCase().includes("closed"))
  );
}

/**
 * Check if error requires re-authentication
 */
export function isAuthError(error: unknown): boolean {
  const parsed = parseApiError(error);
  return parsed.isAuthError;
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Get error code based on HTTP status
 */
function getCodeFromStatus(status?: number): ErrorCode {
  if (!status) return "UNKNOWN_ERROR";

  switch (status) {
    case 400:
      return "VALIDATION_INVALID_VALUE";
    case 401:
      return "AUTH_UNAUTHORIZED";
    case 403:
      return "AUTH_ADMIN_REQUIRED";
    case 404:
      return "RESOURCE_NOT_FOUND";
    case 409:
      return "RESOURCE_ALREADY_EXISTS";
    case 429:
      return "SERVER_RATE_LIMITED";
    case 500:
    case 502:
    case 503:
      return "SERVER_ERROR";
    default:
      return "UNKNOWN_ERROR";
  }
}

/**
 * Get user-friendly message based on HTTP status
 */
function getMessageFromStatus(status?: number): string {
  if (!status) return DEFAULT_MESSAGES.unknown;

  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return "Please log in to continue.";
    case 403:
      return "You don't have permission for this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This resource already exists.";
    case 429:
      return "Too many requests. Please wait a moment.";
    case 500:
    case 502:
    case 503:
      return DEFAULT_MESSAGES.server;
    default:
      return DEFAULT_MESSAGES.unknown;
  }
}
