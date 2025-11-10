import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getErrorMessage } from "@/utils";
import { accessSecret } from "@/utils/auth";

declare global {
  namespace Express {
    interface Request {
      userId?: any;
    }
  }
}

export default async function validToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const accessToken = req.cookies?.accessToken || req.headers["access-token"];

    if (!accessToken) {
      throw "Unauthorized request";
    }

    const { id: userId } = jwt.verify(
      accessToken,
      accessSecret
    ) as AccessTokenPayload;

    if (!userId) {
      throw "Invalid Access Token";
    }

    req.userId = userId;

    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        message: getErrorMessage(err, "Unauthorized Access"),
      },
    });
  }
}
