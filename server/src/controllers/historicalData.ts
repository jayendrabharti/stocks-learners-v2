import { Request, Response } from "express";
import { fetchHistoricalData } from "@/services";

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

    const result = await fetchHistoricalData({
      scriptCode: script_code,
      exchange,
      segment,
      timeRange: time_range,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve historical data.",
      },
    });
  }
};
