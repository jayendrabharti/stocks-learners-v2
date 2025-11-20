import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getErrorMessage } from "@/utils";
import { accessSecret } from "@/utils/auth";
import type { UserModel } from "@/database/generated/models/User";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
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

    const user = jwt.verify(accessToken, accessSecret) as AccessTokenPayload;

    if (!user.id) {
      throw "Invalid Access Token";
    }

    req.user = user;

    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        message: getErrorMessage(err, "Unauthorized Access"),
      },
    });
  }
}
