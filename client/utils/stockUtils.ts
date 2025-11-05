/**
 * Utility functions for stock-related operations
 */

/**
 * Get the stock logo URL using Groww's updated logo API
 * @param stockSymbol - The stock symbol (trading symbol)
 * @returns URL to the stock logo image
 */
export const getStockLogoUrl = (stockSymbol: string): string => {
  if (!stockSymbol) return "";
  return `https://assets-netstorage.groww.in/stock-assets/logos2/${stockSymbol}.webp`;
};

/**
 * Get fallback initials for stock symbol
 * @param symbol - The stock symbol
 * @returns First 2 characters of the symbol
 */
export const getStockInitials = (symbol: string): string => {
  if (!symbol) return "??";
  return symbol.substring(0, 2).toUpperCase();
};
