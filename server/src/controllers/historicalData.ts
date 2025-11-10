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

    switch (time_range) {
      case "1D":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/daily?intervalInMinutes=1`;
        break;
      case "1W":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/weekly?intervalInMinutes=5`;
        break;
      case "1M":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/monthly?intervalInMinutes=30`;
        break;
      case "3M":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/monthly/v2?months=3`;
        break;
      case "6M":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/monthly/v2?months=6`;
        break;
      case "1Y":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/1y?intervalInDays=1`;
        break;
      case "3Y":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/3y?intervalInDays=3`;
        break;
      case "5Y":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/5y?intervalInDays=5`;
        break;
      case "ALL":
        historicalUrl = `https://groww.in/v1/api/charting_service/v2/chart/exchange/${exchange}/segment/${segment}/${script_code}/all?noOfCandles=300`;
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
