/**
 * Async error handling utilities
 */

import { toast } from "sonner";

export interface AsyncResult<T> {
  data?: T;
  error?: Error;
  success: boolean;
}

/**
 * Safely execute async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
): Promise<AsyncResult<T>> {
  try {
    const data = await fn();
    return { data, success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (errorMessage) {
      toast.error(errorMessage);
    }
    return { error: err, success: false };
  }
}

/**
 * Retry async function with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, attempt)),
        );
      }
    }
  }

  throw lastError!;
}

/**
 * Execute async function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs = 30000,
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
    ),
  ]);
}
