import { Request, Response } from "express";

export const GetLiveData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const segment = (req.query.segment as "CASH" | "FNO") || "CASH";
    const tradingSymbol = req.query.tradingSymbol as string | undefined;
    const exchange = (req.query.exchange as "NSE" | "BSE") || "NSE";
    const access_token = process.env.GROWW_ACCESS_TOKEN;

    if (!tradingSymbol) {
      return res.status(400).json({
        success: false,
        message: "Trading Symbol is required.",
      });
    }

    const quoteUrl = `https://api.groww.in/v1/live-data/quote?exchange=${encodeURIComponent(
      exchange
    )}&segment=${encodeURIComponent(
      segment
    )}&trading_symbol=${encodeURIComponent(tradingSymbol)}`;

    const quoteResponse = await fetch(quoteUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
        "X-API-VERSION": "1.0",
      },
    });

    if (quoteResponse.ok) {
      const quoteData = await quoteResponse.json();
      return res.status(200).json({
        tradingSymbol,
        exchange,
        segment,
        success: true,
        data: quoteData,
      });
    } else {
      return res.status(500).json({
        success: false,
        tradingSymbol,
        exchange,
        segment,
        error: `Failed to fetch: ${quoteResponse.statusText}`,
      });
    }
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve live data.",
    });
  }
};
