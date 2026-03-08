/**
 * Application Error System
 * Provides standardized error codes and messages for consistent error handling
 */

/**
 * Error codes used throughout the application
 * Format: CATEGORY_SPECIFIC_ERROR
 */
export enum ErrorCode {
  // Authentication errors (AUTH_*)
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID",
  AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND",
  AUTH_ADMIN_REQUIRED = "AUTH_ADMIN_REQUIRED",

  // Validation errors (VALIDATION_*)
  VALIDATION_REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD",
  VALIDATION_INVALID_FORMAT = "VALIDATION_INVALID_FORMAT",
  VALIDATION_INVALID_VALUE = "VALIDATION_INVALID_VALUE",
  VALIDATION_OUT_OF_RANGE = "VALIDATION_OUT_OF_RANGE",

  // Trading errors (TRADING_*)
  TRADING_MARKET_CLOSED = "TRADING_MARKET_CLOSED",
  TRADING_INSUFFICIENT_FUNDS = "TRADING_INSUFFICIENT_FUNDS",
  TRADING_INSUFFICIENT_MARGIN = "TRADING_INSUFFICIENT_MARGIN",
  TRADING_INSUFFICIENT_QUANTITY = "TRADING_INSUFFICIENT_QUANTITY",
  TRADING_INVALID_QUANTITY = "TRADING_INVALID_QUANTITY",
  TRADING_INVALID_LOT_SIZE = "TRADING_INVALID_LOT_SIZE",
  TRADING_INVALID_TICK_SIZE = "TRADING_INVALID_TICK_SIZE",
  TRADING_FREEZE_LIMIT_EXCEEDED = "TRADING_FREEZE_LIMIT_EXCEEDED",
  TRADING_BUY_NOT_ALLOWED = "TRADING_BUY_NOT_ALLOWED",
  TRADING_SELL_NOT_ALLOWED = "TRADING_SELL_NOT_ALLOWED",
  TRADING_INSTRUMENT_RESERVED = "TRADING_INSTRUMENT_RESERVED",
  TRADING_ORDER_FAILED = "TRADING_ORDER_FAILED",
  TRADING_PRICE_FETCH_FAILED = "TRADING_PRICE_FETCH_FAILED",

  // Position errors (POSITION_*)
  POSITION_NOT_FOUND = "POSITION_NOT_FOUND",
  POSITION_ALREADY_CLOSED = "POSITION_ALREADY_CLOSED",
  POSITION_SQUARE_OFF_FAILED = "POSITION_SQUARE_OFF_FAILED",

  // Instrument errors (INSTRUMENT_*)
  INSTRUMENT_NOT_FOUND = "INSTRUMENT_NOT_FOUND",
  INSTRUMENT_NOT_TRADEABLE = "INSTRUMENT_NOT_TRADEABLE",
  INSTRUMENT_EXPIRED = "INSTRUMENT_EXPIRED",

  // Account errors (ACCOUNT_*)
  ACCOUNT_NOT_FOUND = "ACCOUNT_NOT_FOUND",
  ACCOUNT_INSUFFICIENT_BALANCE = "ACCOUNT_INSUFFICIENT_BALANCE",
  ACCOUNT_WITHDRAWAL_EXCEEDS_BALANCE = "ACCOUNT_WITHDRAWAL_EXCEEDS_BALANCE",

  // Payment errors (PAYMENT_*)
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_VERIFICATION_FAILED = "PAYMENT_VERIFICATION_FAILED",
  PAYMENT_ALREADY_PROCESSED = "PAYMENT_ALREADY_PROCESSED",

  // Event errors (EVENT_*)
  EVENT_NOT_FOUND = "EVENT_NOT_FOUND",
  EVENT_NOT_ACTIVE = "EVENT_NOT_ACTIVE",
  EVENT_REGISTRATION_CLOSED = "EVENT_REGISTRATION_CLOSED",
  EVENT_ALREADY_REGISTERED = "EVENT_ALREADY_REGISTERED",
  EVENT_NOT_REGISTERED = "EVENT_NOT_REGISTERED",
  EVENT_NOT_STARTED = "EVENT_NOT_STARTED",
  EVENT_ENDED = "EVENT_ENDED",

  // Resource errors (RESOURCE_*)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",

  // Server errors (SERVER_*)
  SERVER_ERROR = "SERVER_ERROR",
  SERVER_DATABASE_ERROR = "SERVER_DATABASE_ERROR",
  SERVER_EXTERNAL_API_ERROR = "SERVER_EXTERNAL_API_ERROR",
  SERVER_RATE_LIMITED = "SERVER_RATE_LIMITED",
}

/**
 * User-friendly messages for each error code
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Auth
  [ErrorCode.AUTH_UNAUTHORIZED]: "Please log in to continue",
  [ErrorCode.AUTH_TOKEN_EXPIRED]:
    "Your session has expired. Please log in again",
  [ErrorCode.AUTH_TOKEN_INVALID]: "Invalid authentication. Please log in again",
  [ErrorCode.AUTH_USER_NOT_FOUND]:
    "User account not found. Please sign up or log in again",
  [ErrorCode.AUTH_ADMIN_REQUIRED]: "Admin access required for this action",

  // Validation
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: "Please fill in all required fields",
  [ErrorCode.VALIDATION_INVALID_FORMAT]:
    "Invalid format. Please check your input",
  [ErrorCode.VALIDATION_INVALID_VALUE]: "Invalid value provided",
  [ErrorCode.VALIDATION_OUT_OF_RANGE]: "Value is out of acceptable range",

  // Trading
  [ErrorCode.TRADING_MARKET_CLOSED]:
    "Market is currently closed. Orders can only be placed during market hours (9:15 AM - 3:30 PM IST)",
  [ErrorCode.TRADING_INSUFFICIENT_FUNDS]:
    "Insufficient funds to place this order",
  [ErrorCode.TRADING_INSUFFICIENT_MARGIN]:
    "Insufficient margin available. Please add funds or reduce order size",
  [ErrorCode.TRADING_INSUFFICIENT_QUANTITY]:
    "You don't have enough shares to sell",
  [ErrorCode.TRADING_INVALID_QUANTITY]: "Please enter a valid quantity",
  [ErrorCode.TRADING_INVALID_LOT_SIZE]:
    "Quantity must be in multiples of lot size",
  [ErrorCode.TRADING_INVALID_TICK_SIZE]:
    "Price must be in valid tick increments",
  [ErrorCode.TRADING_FREEZE_LIMIT_EXCEEDED]:
    "Order quantity exceeds the maximum limit",
  [ErrorCode.TRADING_BUY_NOT_ALLOWED]:
    "Buying is not allowed for this instrument",
  [ErrorCode.TRADING_SELL_NOT_ALLOWED]:
    "Selling is not allowed for this instrument",
  [ErrorCode.TRADING_INSTRUMENT_RESERVED]:
    "This instrument is currently not available for trading",
  [ErrorCode.TRADING_ORDER_FAILED]:
    "Order could not be executed. Please try again",
  [ErrorCode.TRADING_PRICE_FETCH_FAILED]:
    "Unable to fetch current market price. Please try again",

  // Position
  [ErrorCode.POSITION_NOT_FOUND]: "Position not found or already closed",
  [ErrorCode.POSITION_ALREADY_CLOSED]: "This position has already been closed",
  [ErrorCode.POSITION_SQUARE_OFF_FAILED]:
    "Failed to close position. Please try again",

  // Instrument
  [ErrorCode.INSTRUMENT_NOT_FOUND]: "Instrument not found",
  [ErrorCode.INSTRUMENT_NOT_TRADEABLE]:
    "This instrument is not available for trading",
  [ErrorCode.INSTRUMENT_EXPIRED]: "This contract has expired",

  // Account
  [ErrorCode.ACCOUNT_NOT_FOUND]: "Account not found. Please contact support",
  [ErrorCode.ACCOUNT_INSUFFICIENT_BALANCE]: "Insufficient account balance",
  [ErrorCode.ACCOUNT_WITHDRAWAL_EXCEEDS_BALANCE]:
    "Withdrawal amount exceeds available balance",

  // Payment
  [ErrorCode.PAYMENT_FAILED]: "Payment failed. Please try again",
  [ErrorCode.PAYMENT_VERIFICATION_FAILED]:
    "Payment verification failed. If money was deducted, it will be refunded",
  [ErrorCode.PAYMENT_ALREADY_PROCESSED]:
    "This payment has already been processed",

  // Event
  [ErrorCode.EVENT_NOT_FOUND]: "Event not found",
  [ErrorCode.EVENT_NOT_ACTIVE]: "This event is not currently active",
  [ErrorCode.EVENT_REGISTRATION_CLOSED]:
    "Registration for this event has closed",
  [ErrorCode.EVENT_ALREADY_REGISTERED]:
    "You are already registered for this event",
  [ErrorCode.EVENT_NOT_REGISTERED]: "You are not registered for this event",
  [ErrorCode.EVENT_NOT_STARTED]: "This event has not started yet",
  [ErrorCode.EVENT_ENDED]: "This event has ended",

  // Resource
  [ErrorCode.RESOURCE_NOT_FOUND]: "The requested resource was not found",
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: "This resource already exists",

  // Server
  [ErrorCode.SERVER_ERROR]: "Something went wrong. Please try again later",
  [ErrorCode.SERVER_DATABASE_ERROR]:
    "A database error occurred. Please try again",
  [ErrorCode.SERVER_EXTERNAL_API_ERROR]:
    "External service unavailable. Please try again",
  [ErrorCode.SERVER_RATE_LIMITED]:
    "Too many requests. Please wait a moment and try again",
};

/**
 * Suggested actions for recoverable errors
 */
export const ErrorActions: Partial<
  Record<ErrorCode, { label: string; href?: string }>
> = {
  [ErrorCode.AUTH_UNAUTHORIZED]: { label: "Log In", href: "/login" },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: { label: "Log In", href: "/login" },
  [ErrorCode.TRADING_INSUFFICIENT_FUNDS]: {
    label: "Contact Admin",
    href: "/contact",
  },
  [ErrorCode.TRADING_INSUFFICIENT_MARGIN]: {
    label: "Contact Admin",
    href: "/contact",
  },
  [ErrorCode.ACCOUNT_INSUFFICIENT_BALANCE]: {
    label: "Contact Admin",
    href: "/contact",
  },
  [ErrorCode.EVENT_REGISTRATION_CLOSED]: {
    label: "View Other Events",
    href: "/events",
  },
  [ErrorCode.EVENT_NOT_REGISTERED]: { label: "Register Now", href: "/events" },
};

/**
 * HTTP status codes for each error category
 */
export function getHttpStatusForError(code: ErrorCode): number {
  if (code.startsWith("AUTH_")) return 401;
  if (code.startsWith("VALIDATION_")) return 400;
  if (code.startsWith("TRADING_") && code !== ErrorCode.TRADING_ORDER_FAILED)
    return 400;
  if (code.includes("NOT_FOUND")) return 404;
  if (code.includes("ALREADY_EXISTS") || code.includes("ALREADY_")) return 409;
  if (code === ErrorCode.AUTH_ADMIN_REQUIRED) return 403;
  if (code.startsWith("SERVER_")) return 500;
  return 400;
}

/**
 * Custom Application Error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly action?: { label: string; href?: string };

  constructor(
    code: ErrorCode,
    customMessage?: string,
    details?: Record<string, unknown>,
  ) {
    const message = customMessage || ErrorMessages[code];
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = getHttpStatusForError(code);
    this.details = details;
    this.action = ErrorActions[code];

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to JSON response format
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(this.action && { action: this.action }),
      },
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to create AppError from various error types
 */
export function createAppError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.SERVER_ERROR,
): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to infer error code from message
    const message = error.message.toLowerCase();

    if (message.includes("market") && message.includes("closed")) {
      return new AppError(ErrorCode.TRADING_MARKET_CLOSED, error.message);
    }
    if (
      message.includes("insufficient funds") ||
      message.includes("insufficient margin")
    ) {
      return new AppError(ErrorCode.TRADING_INSUFFICIENT_FUNDS, error.message);
    }
    if (
      message.includes("insufficient quantity") ||
      message.includes("no open")
    ) {
      return new AppError(
        ErrorCode.TRADING_INSUFFICIENT_QUANTITY,
        error.message,
      );
    }
    if (message.includes("not found")) {
      return new AppError(ErrorCode.RESOURCE_NOT_FOUND, error.message);
    }
    if (message.includes("lot size")) {
      return new AppError(ErrorCode.TRADING_INVALID_LOT_SIZE, error.message);
    }
    if (message.includes("tick size")) {
      return new AppError(ErrorCode.TRADING_INVALID_TICK_SIZE, error.message);
    }
    if (message.includes("not allowed")) {
      return new AppError(ErrorCode.TRADING_ORDER_FAILED, error.message);
    }
    if (message.includes("invalid") && message.includes("price")) {
      return new AppError(ErrorCode.TRADING_PRICE_FETCH_FAILED, error.message);
    }

    return new AppError(defaultCode, error.message);
  }

  if (typeof error === "string") {
    return new AppError(defaultCode, error);
  }

  return new AppError(defaultCode);
}

/**
 * Express error handler helper
 */
export function handleControllerError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.SERVER_ERROR,
): { statusCode: number; body: ReturnType<AppError["toJSON"]> } {
  const appError = createAppError(error, defaultCode);
  console.error(`[${appError.code}] ${appError.message}`, error);

  return {
    statusCode: appError.statusCode,
    body: appError.toJSON(),
  };
}
