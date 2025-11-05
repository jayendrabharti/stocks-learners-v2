import { Request, Response } from "express";

type GrowwInterval = "1d" | "1w" | "1m" | "3m" | "6m" | "1y" | "2y" | "3y";

const MARKET_TIME_ZONE = "Asia/Kolkata";

const formatTimestampForGroww = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MARKET_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);

  const part = (type: Intl.DateTimeFormatPart["type"]): string => {
    return parts.find((segment) => segment.type === type)?.value ?? "00";
  };

  return `${part("year")}-${part("month")}-${part("day")} ${part(
    "hour"
  )}:${part("minute")}:${part("second")}`;
};

const deriveDateRange = (
  interval: GrowwInterval
): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date(end.getTime());

  switch (interval) {
    case "1d":
      start.setDate(start.getDate() - 1);
      break;
    case "1w":
      start.setDate(start.getDate() - 7);
      break;
    case "1m":
      start.setMonth(start.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(start.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 6);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "2y":
      start.setFullYear(start.getFullYear() - 2);
      break;
    case "3y":
      start.setFullYear(start.getFullYear() - 3);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
      break;
  }

  return { start, end };
};

const normalizeCustomTimestamp = (value: string): Date | null => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

export const GetHistoricalData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      exchange = "NSE",
      tradingSymbol,
      interval = "1d",
      segment = "CASH",
      startTime: startTimeQuery,
      endTime: endTimeQuery,
    } = req.query as {
      exchange?: "NSE" | "BSE";
      tradingSymbol?: string;
      interval?: GrowwInterval;
      segment?: "CASH" | "FNO";
      startTime?: string;
      endTime?: string;
    };

    if (!tradingSymbol) {
      return res.status(400).json({
        success: false,
        message: "Trading Symbol is required.",
      });
    }

    const access_token = process.env.GROWW_ACCESS_TOKEN;

    if (!access_token) {
      return res.status(500).json({
        success: false,
        message: "Groww access token is not configured.",
      });
    }

    if (
      (startTimeQuery && !endTimeQuery) ||
      (!startTimeQuery && endTimeQuery)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Both startTime and endTime are required when overriding the range.",
      });
    }

    let startTime: string;
    let endTime: string;

    if (startTimeQuery && endTimeQuery) {
      const parsedStart = normalizeCustomTimestamp(startTimeQuery);
      const parsedEnd = normalizeCustomTimestamp(endTimeQuery);

      if (!parsedStart || !parsedEnd) {
        return res.status(400).json({
          success: false,
          message: "Unable to parse the provided startTime or endTime.",
        });
      }

      if (parsedEnd <= parsedStart) {
        return res.status(400).json({
          success: false,
          message: "endTime must be greater than startTime.",
        });
      }

      startTime = formatTimestampForGroww(parsedStart);
      endTime = formatTimestampForGroww(parsedEnd);
    } else {
      const { start, end } = deriveDateRange(interval ?? "1d");
      startTime = formatTimestampForGroww(start);
      endTime = formatTimestampForGroww(end);
    }

    const historicalUrl = `https://api.groww.in/v1/historical/candle/range?exchange=${encodeURIComponent(
      exchange
    )}&segment=${encodeURIComponent(
      segment
    )}&trading_symbol=${encodeURIComponent(
      tradingSymbol
    )}&start_time=${encodeURIComponent(
      startTime
    )}&end_time=${encodeURIComponent(endTime)}`;

    const historicalResponse = await fetch(historicalUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
        "X-API-VERSION": "1.0",
      },
    });

    if (historicalResponse.ok) {
      const historicalData = await historicalResponse.json();
      return res.status(200).json({
        tradingSymbol,
        exchange,
        segment,
        interval,
        startTime,
        endTime,
        success: true,
        data: historicalData,
      });
    }

    const errorText = await historicalResponse.text();

    return res.status(historicalResponse.status).json({
      success: false,
      tradingSymbol,
      exchange,
      segment,
      interval,
      startTime,
      endTime,
      error:
        errorText?.trim().length > 0
          ? errorText.trim()
          : `Failed to fetch: ${historicalResponse.statusText}`,
    });
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve historical data.",
    });
  }
};
