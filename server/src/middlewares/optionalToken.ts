import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { accessSecret } from "@/utils/auth";
import { User } from "@/database/generated/client";

export default async function optionalToken(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    const accessToken = req.cookies?.accessToken || req.headers["access-token"];

    if (!accessToken) {
      return next();
    }

    const user = jwt.verify(accessToken, accessSecret) as AccessTokenPayload;

    if (user && user.id) {
      req.user = user as User;
    }

    return next();
  } catch (err) {
    // If token is invalid, just proceed without user
    return next();
  }
}
