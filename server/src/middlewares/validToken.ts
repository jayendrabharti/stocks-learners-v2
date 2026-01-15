import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { accessSecret } from "@/utils/auth";
import { User } from "@/database/generated/client";
import { ErrorCode, ErrorMessages, ErrorActions } from "@/utils/errors";

declare global {
  namespace Express {
    interface Request {
      user?: User;
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
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.AUTH_UNAUTHORIZED,
          message: ErrorMessages[ErrorCode.AUTH_UNAUTHORIZED],
          action: ErrorActions[ErrorCode.AUTH_UNAUTHORIZED],
        },
      });
    }

    const user = jwt.verify(accessToken, accessSecret) as AccessTokenPayload;

    if (!user.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: ErrorCode.AUTH_TOKEN_INVALID,
          message: ErrorMessages[ErrorCode.AUTH_TOKEN_INVALID],
          action: ErrorActions[ErrorCode.AUTH_TOKEN_INVALID],
        },
      });
    }

    req.user = user;

    return next();
  } catch (err) {
    // JWT verification failed - could be expired or invalid
    const isExpired = err instanceof jwt.TokenExpiredError;
    const errorCode = isExpired
      ? ErrorCode.AUTH_TOKEN_EXPIRED
      : ErrorCode.AUTH_TOKEN_INVALID;

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message: ErrorMessages[errorCode],
        action: ErrorActions[errorCode],
      },
    });
  }
}
