import { getErrorMessage } from "@/utils";
import { Request, Response } from "express";

export const GetMetadata = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const searchId = req.query.search_id;

    if (!searchId) {
      throw new Error("search_id query parameter is required");
    }

    const searchUrl = `https://groww.in/v1/api/stocks_data/v1/company/search_id/${searchId}?fields=COMPANY_HEADER&page=0&size=10`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch data from external API");
    }

    const data = (await response.json()) as {
      header?: Record<string, unknown>;
    };

    return res.status(200).json(data.header ?? {});
  } catch (error) {
    return res.status(500).json({
      error: {
        message: getErrorMessage(error),
      },
    });
  }
};
