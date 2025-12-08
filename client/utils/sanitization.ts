/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input by removing potentially harmful characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets to prevent XSS
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove inline event handlers
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize phone number (keep only digits and +)
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Validate and sanitize number input
 */
export function sanitizeNumber(input: string | number): number | null {
  const num = typeof input === "string" ? parseFloat(input) : input;
  return isNaN(num) ? null : num;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (10 digits for Indian numbers)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      (sanitized as any)[key] = sanitizeString(sanitized[key]);
    }
  }
  return sanitized;
}
