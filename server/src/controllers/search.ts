import { Request, Response } from "express";
import { performGlobalSearch } from "@/services";

export const Search = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { query, from = "0", size = "20", web = "true" } = req.query;

    // Validate required query parameter
    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
      });
    }

    const result = await performGlobalSearch({
      query,
      from: parseInt(from as string),
      size: parseInt(size as string),
      web: web === "true",
    });

    return res.status(200).json({
      success: true,
      instruments: result.content,
    });
  } catch (error) {
    console.error("Error in global search:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to perform global search",
    });
  }
};
