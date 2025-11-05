import { Request, Response } from "express";

export const Search = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { query, from = "0", size = "20", web = "true" } = req.query;

    // Validate required query parameter
    if (!query || typeof query !== "string") {
      res.status(400).json({
        success: false,
        message: "Query parameter is required",
      });
      return res.status(500).json({
        success: false,
        message: "Query parameter is required",
      });
    }

    // Make request to Groww's global search API
    const growwSearchUrl = `https://groww.in/v1/api/search/v3/query/global/st_query?from=${from}&query=${encodeURIComponent(
      query
    )}&size=${size}&web=${web}`;

    console.log("Fetching from Groww API:", growwSearchUrl);

    const growwResponse = await fetch(growwSearchUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!growwResponse.ok) {
      return res.status(growwResponse.status).json({
        success: false,
        message: `Groww API responded with status: ${growwResponse.status}`,
      });
    }

    const searchData = await growwResponse.json();

    const responseData = (searchData as any)?.data || searchData;

    return res.status(200).json({
      success: true,
      instruments: responseData.content,
    });
  } catch (error) {
    console.error("Error in global search:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to perform global search",
    });
  }
};
