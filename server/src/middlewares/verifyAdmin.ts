import { Request, Response, NextFunction } from "express";
import { getErrorMessage } from "@/utils";
import type { UserModel } from "@/database/generated/models/User";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
    }
  }
}

export default async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    if (!req.user?.id) {
      throw "Invalid Access Token";
    }

    if (!req.user.isAdmin) {
      throw "Unauthorized request";
    }

    return next();
  } catch (err) {
    return res.status(401).json({
      error: {
        message: getErrorMessage(err, "Unauthorized Access"),
      },
    });
  }
}
