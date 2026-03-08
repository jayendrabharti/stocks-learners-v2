import { Request, Response } from "express";
import prisma from "@/database/client";
import { fromDecimal, toDecimal, roundCurrency } from "@/utils/currency";
import { AppError, ErrorCode, handleControllerError } from "@/utils/errors";

/**
 * Get user account details
 */
export const getAccount = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(ErrorCode.AUTH_UNAUTHORIZED);
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(
        ErrorCode.AUTH_USER_NOT_FOUND,
        "User not found. Please log in again.",
      );
    }

    // Get or create account (atomic operation)
    const account = await prisma.account.upsert({
      where: { userId },
      create: {
        userId,
        cash: toDecimal(0),
        usedMargin: toDecimal(0),
      },
      update: {}, // No update needed, just fetch
    });

    // Convert Decimal to number for response
    const cash = fromDecimal(account.cash);
    const usedMargin = fromDecimal(account.usedMargin);
    const availableMargin = cash;

    return res.status(200).json({
      success: true,
      account: {
        cash,
        usedMargin,
        availableMargin,
        totalFunds: roundCurrency(cash + usedMargin), // For transparency
      },
    });
  } catch (error) {
    const { statusCode, body } = handleControllerError(
      error,
      ErrorCode.SERVER_ERROR,
    );
    return res.status(statusCode).json(body);
  }
};
