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

export const getTimeRangeParams = (range: string) => {
  const now = new Date();
  const endTime = now.toISOString().slice(0, 19).replace("T", " ");
  let startTime: string;
  let candleInterval: string;

  switch (range) {
    case "1D":
      startTime = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "15minute"; // 15 minutes for intraday
      break;
    case "1W":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "1hour"; // 1 hour
      break;
    case "1M":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "4hour"; // 4 hours
      break;
    case "3M":
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "1day"; // 1 day
      break;
    case "6M":
      startTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "1day"; // 1 day
      break;
    case "1Y":
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "1week"; // 1 week
      break;
    case "3Y":
      startTime = new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "1week"; // 1 week
      break;
    case "5Y":
      startTime = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "1month"; // 1 month for 5 years
      break;
    default:
      startTime = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      candleInterval = "15minute";
  }

  return { startTime, endTime, candleInterval };
};
