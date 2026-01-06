import { Request, Response } from "express";
import prisma from "@/database/client";
import {
  fromDecimal,
  toDecimal,
  roundCurrency,
  parseAmount,
} from "@/utils/currency";

/**
 * Get user account details
 */
export const getAccount = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please log in again.",
      });
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
    console.error("Error fetching account:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch account details",
      },
    });
  }
};

/**
 * Deposit funds (with exchange rate)
 */
export const depositFunds = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { amount } = req.body; // Real money amount

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validate and parse amount using currency utility
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Must be a positive number",
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    // Get exchange rate
    const settings = await prisma.appSettings.findFirst();
    const exchangeRate = settings ? fromDecimal(settings.exchangeRate) : 1.0;

    // Calculate dummy money with proper rounding
    const dummyMoney = roundCurrency(parsedAmount * exchangeRate);

    // Use upsert to atomically create or update account (prevents race condition)
    const account = await prisma.account.upsert({
      where: { userId },
      create: {
        userId,
        cash: toDecimal(dummyMoney),
        usedMargin: toDecimal(0),
      },
      update: {
        cash: { increment: dummyMoney },
      },
    });

    // Convert Decimal to number for response
    const cash = fromDecimal(account.cash);
    const usedMargin = fromDecimal(account.usedMargin);

    return res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${parsedAmount} (received ₹${dummyMoney} dummy money)`,
      deposit: {
        realMoney: parsedAmount,
        exchangeRate,
        dummyMoney,
      },
      account: {
        cash,
        usedMargin,
        availableMargin: cash, // Cash already excludes used margin
        totalFunds: roundCurrency(cash + usedMargin),
      },
    });
  } catch (error) {
    console.error("Error depositing funds:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deposit funds",
    });
  }
};

/**
 * Withdraw funds (manual - for testing before payment integration)
 */
export const withdrawFunds = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const { amount } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validate and parse amount using currency utility
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Must be a positive number",
      });
    }

    const account = await prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Use Serializable transaction for atomic withdrawal (prevents race condition)
    const updatedAccount = await prisma.$transaction(
      async (tx) => {
        // Re-fetch account inside transaction for atomic check
        const currentAccount = await tx.account.findUnique({
          where: { userId },
        });

        if (!currentAccount) {
          throw new Error("Account not found");
        }

        const availableMargin = fromDecimal(currentAccount.cash);

        if (parsedAmount > availableMargin) {
          throw new Error(
            `Insufficient funds. Available: ₹${availableMargin.toFixed(
              2
            )}, Requested: ₹${parsedAmount.toFixed(2)}`
          );
        }

        return tx.account.update({
          where: { userId },
          data: {
            cash: { decrement: parsedAmount },
          },
        });
      },
      {
        isolationLevel: "Serializable" as const,
        timeout: 10000,
      }
    );

    // Convert Decimal to number for response
    const cash = fromDecimal(updatedAccount.cash);
    const usedMargin = fromDecimal(updatedAccount.usedMargin);

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew ₹${parsedAmount}`,
      account: {
        cash,
        usedMargin,
        availableMargin: cash, // Cash already excludes used margin
        totalFunds: roundCurrency(cash + usedMargin),
      },
    });
  } catch (error: any) {
    console.error("Error withdrawing funds:", error);

    // Handle insufficient funds error from transaction
    if (error.message?.includes("Insufficient funds")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to withdraw funds",
    });
  }
};
