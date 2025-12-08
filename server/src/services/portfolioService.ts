import { getLivePrice } from "@/utils/trading/livePrice";
import { calculateTotalUnrealizedPnL } from "@/utils/trading/calculatePnL";

// Import cache utilities
import { livePriceCache, generatePriceCacheKey } from "@/utils/trading/priceCache";

// Helper to fetch price with caching
async function getLivePriceWithCache(
  tradingSymbol: string,
  exchange: any,
  type: any,
  exchangeToken: string
): Promise<number> {
  const cacheKey = generatePriceCacheKey(tradingSymbol, exchange, type, exchangeToken);
  
  // Check cache first
  const cachedPrice = livePriceCache.get(cacheKey);
  if (cachedPrice !== null) {
    return cachedPrice;
  }
  
  // Fetch from API
  const price = await getLivePrice(tradingSymbol, exchange, type, exchangeToken);
  
  // Store in cache
  livePriceCache.set(cacheKey, price);
  
  return price;
}

export interface PortfolioPosition {
  id: string;
  instrument: {
    id: string;
    tradingSymbol: string;
    exchange: any; // Using any to avoid importing Prisma enums if not strictly necessary, or import them
    type: any;
    exchangeToken: string;
    name: string | null;
    segment: any;
    searchId: string | null;
  };
  qty: number;
  avgPrice: number;
  realizedPnl: number;
  product: any; // TradeType
  isOpen: boolean;
  transactions: { fees: number }[];
  lots: {
    id: string;
    totalQty: number;
    remainingQty: number;
    buyPrice: number;
    createdAt: Date;
  }[];
}

export interface PortfolioAccount {
  cash: number;
  usedMargin: number;
}

export interface PortfolioInput {
  account: PortfolioAccount;
  openPositions: PortfolioPosition[];
  allPositionsRealizedPnl: number; // Sum of realized P&L from ALL positions (open + closed)
  totalFeesPaid: number; // Sum of fees from ALL transactions
}

export const calculatePortfolioStats = async (input: PortfolioInput) => {
  const { account, openPositions, allPositionsRealizedPnl, totalFeesPaid } = input;

  let totalInvestedValue = 0;
  let totalCurrentValue = 0;
  let totalRealizedPnLOpenPositions = 0;
  let totalUnrealizedPnL = 0;
  let totalFeesInOpenPositions = 0;

  const holdingsByProduct: Record<string, any[]> = {
    CNC: [],
    MIS: [],
  };

  const positionsWithPnL: Array<{
    position: PortfolioPosition;
    unrealizedPnL: number;
    totalPnL: number;
  }> = [];

  // OPTIMIZATION: Fetch all prices in parallel instead of sequential N+1 query
  const pricePromises = openPositions.map(position =>
    getLivePriceWithCache(
      position.instrument.tradingSymbol,
      position.instrument.exchange,
      position.instrument.type,
      position.instrument.exchangeToken
    )
  );

  // Use allSettled to handle individual failures gracefully
  const priceResults = await Promise.allSettled(pricePromises);

  // Process each position with its corresponding price
  for (let i = 0; i < openPositions.length; i++) {
    const position = openPositions[i];
    if (!position) continue; // Type guard

    const priceResult = priceResults[i];
    if (!priceResult) continue; // Type guard

    try {
      // Get price from result or fallback to avgPrice
      const ltp = priceResult.status === 'fulfilled' 
        ? priceResult.value 
        : position.avgPrice; // Fallback to avg price if fetch failed

      const investedValue = position.avgPrice * position.qty;
      const currentValue = ltp * position.qty;
      const unrealizedPnL = calculateTotalUnrealizedPnL(position.lots as any, ltp);
      const totalPnL = position.realizedPnl + unrealizedPnL;

      // Store for statistics calculation
      positionsWithPnL.push({
        position,
        unrealizedPnL,
        totalPnL,
      });

      // Calculate fees for this position from its transactions
      const positionFees = position.transactions.reduce(
        (sum, t) => sum + t.fees,
        0
      );

      totalInvestedValue += investedValue;
      totalCurrentValue += currentValue;
      totalRealizedPnLOpenPositions += position.realizedPnl;
      totalUnrealizedPnL += unrealizedPnL;
      totalFeesInOpenPositions += positionFees;

      const holding = {
        positionId: position.id,
        product: position.product,
        instrument: {
          id: position.instrument.id,
          tradingSymbol: position.instrument.tradingSymbol,
          name: position.instrument.name,
          exchange: position.instrument.exchange,
          type: position.instrument.type,
          segment: position.instrument.segment,
          searchId: position.instrument.searchId,
        },
        qty: position.qty,
        avgPrice: position.avgPrice,
        currentPrice: ltp,
        investedValue,
        currentValue,
        realizedPnL: position.realizedPnl,
        unrealizedPnL,
        totalPnL,
        pnlPercentage:
          investedValue > 0 ? (totalPnL / investedValue) * 100 : 0,
        dayChange: 0, // Placeholder
        dayChangePercentage: 0,
        lots: position.lots.map((lot) => ({
          id: lot.id,
          totalQty: lot.totalQty,
          remainingQty: lot.remainingQty,
          buyPrice: lot.buyPrice,
          unrealizedPnL: (ltp - lot.buyPrice) * lot.remainingQty,
          createdAt: lot.createdAt.toISOString(),
        })),
      };

      if (!holdingsByProduct[position.product]) {
        holdingsByProduct[position.product] = [];
      }
      holdingsByProduct[position.product]!.push(holding);
    } catch (error) {
      console.error(`Error processing position ${position.id}:`, error);
    }
  }

  // Total P&L = All realized P&L (from all positions) + Current unrealized P&L (from open positions)
  const totalPnL = allPositionsRealizedPnl + totalUnrealizedPnL;

  const totalPnLPercentage =
    totalInvestedValue > 0 ? (totalPnL / totalInvestedValue) * 100 : 0;

  // Available margin = cash (cash already has margins deducted in trading operations)
  const availableMargin = account.cash;
  const totalPortfolioValue = account.cash + account.usedMargin + totalCurrentValue;

  return {
    account: {
      totalCash: account.cash,
      usedMargin: account.usedMargin,
      availableMargin,
    },

    // Portfolio value
    totalPortfolioValue,
    totalInvestedValue,
    totalCurrentValue,

    // P&L summary
    totalRealizedPnL: totalRealizedPnLOpenPositions, // From open positions only
    totalRealizedPnLAllTime: allPositionsRealizedPnl, // From ALL positions
    totalUnrealizedPnL,
    totalPnL,
    totalPnLPercentage,

    // Fees summary
    totalFeesPaid,
    totalFeesInOpenPositions,

    // Holdings breakdown
    holdings: {
      CNC: {
        positions: holdingsByProduct.CNC || [],
        count: (holdingsByProduct.CNC || []).length,
        totalValue: (holdingsByProduct.CNC || []).reduce(
          (sum, h) => sum + h.currentValue,
          0
        ),
        totalPnL: (holdingsByProduct.CNC || []).reduce(
          (sum, h) => sum + h.totalPnL,
          0
        ),
      },
      MIS: {
        positions: holdingsByProduct.MIS || [],
        count: (holdingsByProduct.MIS || []).length,
        totalValue: (holdingsByProduct.MIS || []).reduce(
          (sum, h) => sum + h.currentValue,
          0
        ),
        totalPnL: (holdingsByProduct.MIS || []).reduce(
          (sum, h) => sum + h.totalPnL,
          0
        ),
      },
    },

    // Statistics
    stats: {
      totalPositions: openPositions.length,
      profitablePositions: positionsWithPnL.filter((p) => p.totalPnL > 0)
        .length,
      lossPositions: positionsWithPnL.filter((p) => p.totalPnL < 0).length,
    },
  };
};
