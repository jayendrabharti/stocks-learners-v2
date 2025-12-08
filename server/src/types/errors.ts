/**
 * Standardized Error Codes for API Responses
 * Used to categorize errors and enable frontend to handle them appropriately
 */
export enum ErrorCode {
  // Validation Errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_FIELDS = "MISSING_FIELDS",
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_QUANTITY = "INVALID_QUANTITY",
  INVALID_PRICE = "INVALID_PRICE",

  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",

  // Trading Errors
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  INSUFFICIENT_MARGIN = "INSUFFICIENT_MARGIN",
  INSUFFICIENT_QUANTITY = "INSUFFICIENT_QUANTITY",
  INVALID_ORDER = "INVALID_ORDER",
  ORDER_EXECUTION_FAILED = "ORDER_EXECUTION_FAILED",
  INSTRUMENT_NOT_FOUND = "INSTRUMENT_NOT_FOUND",
  POSITION_NOT_FOUND = "POSITION_NOT_FOUND",
  INSTRUMENT_NOT_TRADABLE = "INSTRUMENT_NOT_TRADABLE",

  // Account Errors
  ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  WITHDRAWAL_FAILED = "WITHDRAWAL_FAILED",

  // Event Errors
  EVENT_NOT_FOUND = "EVENT_NOT_FOUND",
  EVENT_NOT_ACTIVE = "EVENT_NOT_ACTIVE",
  EVENT_REGISTRATION_FAILED = "EVENT_REGISTRATION_FAILED",
  EVENT_FULL = "EVENT_FULL",
  EVENT_ALREADY_REGISTERED = "EVENT_ALREADY_REGISTERED",
  EVENT_ACCOUNT_NOT_FOUND = "EVENT_ACCOUNT_NOT_FOUND",

  // Payment Errors
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_VERIFICATION_FAILED = "PAYMENT_VERIFICATION_FAILED",
  PAYMENT_ALREADY_PROCESSED = "PAYMENT_ALREADY_PROCESSED",

  // Generic Errors
  NOT_FOUND = "NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

/**
 * Standardized API Error Response Structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: string;
    field?: string;
    action?: string;
  };
}

/**
 * Helper to create standardized error responses
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  options?: {
    details?: string;
    field?: string;
    action?: string;
  }
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...options,
    },
  };
}

/**
 * Common error messages with suggested actions
 */
export const ErrorMessages = {
  INSUFFICIENT_FUNDS: {
    message: "Insufficient funds in your account",
    action: "Add funds to continue trading",
  },
  INSUFFICIENT_MARGIN: {
    message: "Insufficient margin for this order",
    action: "Add funds or reduce order size",
  },
  INSUFFICIENT_QUANTITY: {
    message: "You don't have enough quantity to sell",
    action: "Check your holdings and try again",
  },
  INVALID_ORDER: {
    message: "Order validation failed",
    action: "Please check order details and try again",
  },
  UNAUTHORIZED: {
    message: "You must be logged in to perform this action",
    action: "Please log in and try again",
  },
  EVENT_NOT_ACTIVE: {
    message: "This event is not currently active",
    action: "Check event details for timing information",
  },
  PAYMENT_FAILED: {
    message: "Payment processing failed",
    action: "Please try again or contact support",
  },
};
