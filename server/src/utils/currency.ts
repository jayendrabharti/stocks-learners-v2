/**
 * Currency and Decimal Utilities
 * Handles precision-safe financial calculations
 */

import { Prisma } from "@/database/generated/client";

// Precision for currency operations (4 decimal places)
const CURRENCY_PRECISION = 4;

/**
 * Rounds a number to currency precision (4 decimal places)
 * Prevents floating-point errors in financial calculations
 */
export function roundCurrency(value: number): number {
  const multiplier = Math.pow(10, CURRENCY_PRECISION);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Converts a number to Decimal with proper rounding
 */
export function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(roundCurrency(value));
}

/**
 * Converts a Decimal to number (for calculations)
 */
export function fromDecimal(
  value: Prisma.Decimal | number | null | undefined
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.toNumber();
}

/**
 * Safely adds two currency values
 */
export function addCurrency(a: number, b: number): number {
  return roundCurrency(a + b);
}

/**
 * Safely subtracts two currency values
 */
export function subtractCurrency(a: number, b: number): number {
  return roundCurrency(a - b);
}

/**
 * Safely multiplies two currency values
 */
export function multiplyCurrency(a: number, b: number): number {
  return roundCurrency(a * b);
}

/**
 * Safely divides two currency values
 */
export function divideCurrency(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return roundCurrency(a / b);
}

/**
 * Formats a number as Indian currency string
 */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Validates that a value is a valid positive amount
 */
export function isValidAmount(value: unknown): value is number {
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return !isNaN(parsed) && isFinite(parsed) && parsed > 0;
  }
  return (
    typeof value === "number" && !isNaN(value) && isFinite(value) && value > 0
  );
}

/**
 * Parses an amount string/number to a valid currency value
 * Returns null if invalid
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    if (isNaN(value) || !isFinite(value) || value <= 0) return null;
    return roundCurrency(value);
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) return null;
    return roundCurrency(parsed);
  }
  return null;
}
