import { Request, Response, NextFunction } from "express";
import { getErrorMessage } from "@/utils";
import prisma from "@/database/client";
import type { UserModel } from "@/database/generated/models/User";

declare global {
  namespace Express {
    interface Request {
      user?: UserModel;
    }
  }
}

/**
 * Verify admin middleware
 * SECURITY: Re-verifies admin status from database instead of trusting JWT alone
 * This prevents privilege escalation if a user's admin status is revoked after token issuance
 */
export default async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  try {
    if (!req.user?.id) {
      throw "Invalid Access Token";
    }

    // Re-verify admin status from database (don't trust JWT alone)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, isAdmin: true },
    });

    if (!user) {
      throw "User not found";
    }

    if (!user.isAdmin) {
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
