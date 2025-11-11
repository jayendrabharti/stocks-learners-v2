import { Request, Response } from "express";

export const GetHistoricalData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { script_code, exchange, segment, time_range } = req.query as {
      script_code?: string;
      exchange?: Exchange;
      segment?: Segment;
      time_range?: HistoricalDataTimeRange;
    };

    if (!script_code || !exchange || !segment || !time_range) {
      return res.status(400).json({
        error: {
          message:
            "time_range, script_code, exchange, and segment are required.",
        },
      });
    }

    let historicalUrl: string | null = null;

    // Determine if the segment is FNO (Futures & Options)
    const isFNO = segment === "FNO";
    const baseUrl = isFNO
      ? `https://groww.in/v1/api/stocks_fo_data/v1/charting_service/chart/exchange/${exchange}/segment/${segment}/${script_code}`
      : `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}`;

    switch (time_range) {
      case "1D":
        historicalUrl = `${baseUrl}/daily?intervalInMinutes=${isFNO ? 5 : 1}`;
        break;
      case "1W":
        historicalUrl = `${baseUrl}/weekly?intervalInMinutes=5`;
        break;
      case "1M":
        historicalUrl = isFNO
          ? `${baseUrl}/monthly?intervalInMinutes=30`
          : `${baseUrl}/monthly?intervalInMinutes=30`;
        break;
      case "3M":
        historicalUrl = `${baseUrl}/monthly/v2?months=3`;
        break;
      case "6M":
        historicalUrl = `${baseUrl}/monthly/v2?months=6`;
        break;
      case "1Y":
        historicalUrl = `${baseUrl}/1y?intervalInDays=1`;
        break;
      case "3Y":
        historicalUrl = `${baseUrl}/3y?intervalInDays=3`;
        break;
      case "5Y":
        historicalUrl = `${baseUrl}/5y?intervalInDays=5`;
        break;
      case "ALL":
        historicalUrl = `${baseUrl}/all?noOfCandles=300`;
        break;
      default:
        return res.status(400).json({
          error: {
            message: `Invalid time_range. Supported values: 1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, ALL`,
          },
        });
    }

    const historicalResponse = await fetch(historicalUrl);

    if (historicalResponse.ok) {
      const historicalData: any = await historicalResponse.json();

      return res.status(200).json({
        success: true,
        script_code,
        exchange,
        segment,
        historicalData,
      });
    }

    const errorText = await historicalResponse.text();

    return res.status(historicalResponse.status).json({
      success: false,
      script_code,
      exchange,
      segment,
      error: {
        message:
          errorText?.trim().length > 0
            ? errorText.trim()
            : `Failed to fetch: ${historicalResponse.statusText}`,
      },
    });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Failed to retrieve historical data.",
      },
    });
  }
};
