import { Request, Response } from "express";

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

    const segment: Segment = type === "EQ" || type === "IDX" ? "CASH" : "FNO";

    if (!script_code || !exchange || !type) {
      return res.status(400).json({
        error: {
          message: "Script Code, Exchange and Instrument Type are required.",
        },
      });
    }

    let liveDataUrl: string | null = null;

    switch (type) {
      case "EQ":
        liveDataUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/${exchange}/segment/${segment}/${script_code}/latest`;
        break;
      case "IDX":
        liveDataUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_indices/exchange/${exchange}/segment/${segment}/${script_code}/latest`;
        break;
      case "FUT":
      case "CE":
      case "PE":
        liveDataUrl = `https://groww.in/v1/api/stocks_fo_data/v1/tr_live_prices/exchange/${exchange}/segment/${segment}/${script_code}/latest`;
        break;
      default:
        liveDataUrl = `https://groww.in/v1/api/stocks_data/v1/tr_live_prices/exchange/${exchange}/segment/${segment}/${script_code}/latest`;
        break;
    }

    const liveDataResponse = await fetch(liveDataUrl);

    if (liveDataResponse.ok) {
      const liveData: any = await liveDataResponse.json();

      return res.status(200).json({
        script_code,
        exchange,
        segment,
        liveData,
      });
    } else {
      return res.status(500).json({
        script_code,
        exchange,
        segment,
        error: {
          message: `Failed to fetch: ${liveDataResponse.statusText}`,
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: {
        message: "Failed to retrieve live data.",
      },
    });
  }
};
