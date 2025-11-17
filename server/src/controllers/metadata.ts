import { getErrorMessage } from "@/utils";
import { Request, Response } from "express";
import { fetchCompanyMetadata } from "@/services";

export const GetMetadata = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const searchId = req.query.search_id;

    if (!searchId || typeof searchId !== "string") {
      throw new Error("search_id query parameter is required");
    }

    const metadata = await fetchCompanyMetadata({ searchId });

    return res.status(200).json(metadata);
  } catch (error) {
    return res.status(500).json({
      error: {
        message: getErrorMessage(error),
      },
    });
  }
};
