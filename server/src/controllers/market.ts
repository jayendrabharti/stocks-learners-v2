import { Request, Response } from "express";

// Types for API responses
interface Stock {
  isin: string;
  gsin?: string;
  companyName: string;
  companyShortName: string;
  searchId: string;
  ltp: number;
  logoUrl: string;
  nseScriptCode: string;
  bseScriptCode: string;
  type: string;
  marketCap?: number;
  volumeWeekAvg?: number;
  close: number;
  yearHigh: number;
  yearLow: number;
  volume?: number;
  tag?: string;
  tagColor?: string;
}

interface MostBoughtStock {
  company: {
    isin: string;
    growwContractId: string;
    companyName: string;
    searchId: string;
    nseScriptCode: string;
    companyShortName: string;
    bseScriptCode: string;
    imageUrl: string;
  };
  stats: {
    type: string;
    high: number;
    low: number;
    close: number;
    ltp: number;
    dayChange: number;
    dayChangePerc: number;
    lowPriceRange: number;
    highPriceRange: number;
  };
}

interface TopMoversResponse {
  data: {
    title: string;
    stocks: Stock[];
  };
}

interface MostBoughtResponse {
  exploreCompanies: {
    POPULAR_STOCKS_MOST_BOUGHT: MostBoughtStock[];
  };
}

/**
 * Get most bought stocks on Groww
 */
export const getMostBought = async (req: Request, res: Response) => {
  try {
    const size = parseInt(req.query.size as string) || 10;

    const response = await fetch(
      `https://groww.in/v1/api/stocks_data/v2/explore/list/top?discoveryFilterTypes=POPULAR_STOCKS_MOST_BOUGHT&page=0&size=${size}`,
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          DNT: "1",
          Pragma: "no-cache",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Referer: "https://groww.in/stocks",
          Origin: "https://groww.in",
        },
      }
    );

    const data = (await response.json()) as MostBoughtResponse;

    res.json({
      success: true,
      data: data.exploreCompanies.POPULAR_STOCKS_MOST_BOUGHT,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch most bought stocks",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get top market movers (gainers, losers, or volume shakers)
 */
export const getTopMovers = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "gainers";
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    let moverType: string;
    let indice = "GIDXNIFTY100";

    switch (type.toLowerCase()) {
      case "gainers":
        moverType = "TOP_GAINERS";
        break;
      case "losers":
        moverType = "TOP_LOSERS";
        break;
      case "volume":
        moverType = "VOLUME_SHOCKERS";
        indice = ""; // Volume shockers don't need an indice
        break;
      default:
        res.status(400).json({
          success: false,
          error: "Invalid type. Use 'gainers', 'losers', or 'volume'",
          timestamp: new Date().toISOString(),
        });
        return;
    }

    const url =
      type.toLowerCase() === "volume"
        ? `https://groww.in/bff/web/stocks/web-pages/top_movers?moverType=${moverType}&pageSize=${pageSize}`
        : `https://groww.in/bff/web/stocks/web-pages/top_movers?indice=${indice}&moverType=${moverType}&pageSize=${pageSize}`;

    // Add browser-like headers to get complete data
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        DNT: "1",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Referer: "https://groww.in/stocks",
        Origin: "https://groww.in",
      },
    });

    const data = (await response.json()) as TopMoversResponse;

    res.json({
      success: true,
      data: data.data.stocks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching top movers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch market data",
      timestamp: new Date().toISOString(),
    });
  }
};
