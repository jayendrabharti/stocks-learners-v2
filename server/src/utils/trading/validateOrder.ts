/**
 * Order Validation Utilities
 * Validates trading orders against instrument rules and market regulations
 */

import type { InstrumentModel } from "@/database/generated/models/Instrument";
import type { TradeSide, TradeType } from "@/database/generated/enums";

export type Instrument = InstrumentModel;

export interface OrderValidationError {
  field: string;
  message: string;
}

export interface OrderValidationResult {
  valid: boolean;
  errors: OrderValidationError[];
}

/**
 * Validates if an order complies with all instrument rules
 */
export function validateOrder(
  instrument: Instrument,
  side: TradeSide,
  qty: number,
  price: number,
  _product: TradeType
): OrderValidationResult {
  const errors: OrderValidationError[] = [];

  // Check if instrument is reserved
  if (instrument.isReserved) {
    errors.push({
      field: "instrument",
      message: "This instrument is reserved and cannot be traded",
    });
  }

  // Check buy/sell allowed
  if (side === "BUY" && !instrument.buyAllowed) {
    errors.push({
      field: "side",
      message: "Buying is not allowed for this instrument",
    });
  }

  if (side === "SELL" && !instrument.sellAllowed) {
    errors.push({
      field: "side",
      message: "Selling is not allowed for this instrument",
    });
  }

  // Validate lot size for F&O instruments
  if (instrument.segment === "FNO") {
    if (qty % instrument.lotSize !== 0) {
      errors.push({
        field: "qty",
        message: `Quantity must be in multiples of lot size (${instrument.lotSize})`,
      });
    }
  }

  // Validate freeze quantity
  if (instrument.freezeQty > 0 && qty > instrument.freezeQty) {
    errors.push({
      field: "qty",
      message: `Quantity exceeds freeze limit of ${instrument.freezeQty}`,
    });
  }

  // Validate tick size
  if (!validateTickSize(price, instrument.tickSize)) {
    errors.push({
      field: "price",
      message: `Price must be in multiples of tick size (${instrument.tickSize})`,
    });
  }

  // Validate minimum quantity
  if (qty <= 0) {
    errors.push({
      field: "qty",
      message: "Quantity must be greater than 0",
    });
  }

  // Validate price
  if (price <= 0) {
    errors.push({
      field: "price",
      message: "Price must be greater than 0",
    });
  }

  // Validate segment-specific rules
  if (instrument.segment === "FNO") {
    // F&O must have expiry
    if (!instrument.expiry) {
      errors.push({
        field: "instrument",
        message: "F&O instrument must have an expiry date",
      });
    }

    // Check if expired
    if (instrument.expiry && new Date(instrument.expiry) < new Date()) {
      errors.push({
        field: "instrument",
        message: "This F&O contract has expired",
      });
    }

    // Options must have strike
    if (
      (instrument.type === "CE" || instrument.type === "PE") &&
      !instrument.strike
    ) {
      errors.push({
        field: "instrument",
        message: "Options contract must have a strike price",
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates if price complies with tick size
 */
export function validateTickSize(price: number, tickSize: number): boolean {
  if (tickSize === 0) return true;

  // Handle floating point precision issues
  const multiplier = 1 / tickSize;
  const roundedPrice = Math.round(price * multiplier) / multiplier;

  return Math.abs(price - roundedPrice) < 0.0001;
}

/**
 * Validates if quantity complies with lot size
 */
export function validateLotSize(qty: number, lotSize: number): boolean {
  if (lotSize === 1) return true;
  return qty % lotSize === 0;
}

/**
 * Validates if user has sufficient margin for MIS orders
 */
export function validateMISMargin(
  orderValue: number,
  leverage: number,
  availableMargin: number
): OrderValidationResult {
  const errors: OrderValidationError[] = [];

  const requiredMargin = orderValue / leverage;

  if (requiredMargin > availableMargin) {
    errors.push({
      field: "margin",
      message: `Insufficient margin. Required: ${requiredMargin.toFixed(
        2
      )}, Available: ${availableMargin.toFixed(2)}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates if user has sufficient quantity to sell
 */
export function validateSellQuantity(
  availableQty: number,
  sellQty: number
): OrderValidationResult {
  const errors: OrderValidationError[] = [];

  if (sellQty > availableQty) {
    errors.push({
      field: "qty",
      message: `Insufficient quantity. Available: ${availableQty}, Requested: ${sellQty}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
