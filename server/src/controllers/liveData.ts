import { Request, Response } from "express";
import { fetchLiveData } from "@/services";

type LiveDataQuery = {
  script_code?: string;
  exchange?: Exchange;
  type?: InstrumentType;
};

export const GetLiveData = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { script_code, exchange, type } = req.query as LiveDataQuery;

    if (!script_code || !exchange || !type) {
      return res.status(400).json({
        error: {
          message: "Script Code, Exchange and Instrument Type are required.",
        },
      });
    }

    const result = await fetchLiveData({
      scriptCode: script_code,
      exchange,
      type,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve live data.",
      },
    });
  }
};
