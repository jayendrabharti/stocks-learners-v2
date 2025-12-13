/**
 * Live Price Caching Service
 * Implements simple in-memory cache with TTL for live prices
 */

interface CacheEntry {
  price: number;
  timestamp: number;
}

class PriceCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number;

  constructor(ttlMs: number = 1000) {
    // Default 1 second TTL
    this.ttl = ttlMs;
  }

  get(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      // Expired
      this.cache.delete(key);
      return null;
    }

    return entry.price;
  }

  set(key: string, price: number): void {
    this.cache.set(key, {
      price,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance with 1 second TTL
export const livePriceCache = new PriceCache(1000);

// Cleanup every 5 seconds
setInterval(() => livePriceCache.cleanup(), 5000);

/**
 * Generate cache key for a price request
 */
export function generatePriceCacheKey(
  tradingSymbol: string,
  exchange: string,
  type: string,
  exchangeToken: string
): string {
  return `${exchange}:${tradingSymbol}:${type}:${exchangeToken}`;
}
