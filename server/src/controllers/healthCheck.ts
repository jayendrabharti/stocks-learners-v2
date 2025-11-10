import { Request, Response } from "express";

export const healthCheck = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  return res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
};
