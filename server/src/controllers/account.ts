import { Request, Response } from "express";
import prisma from "@/database/client";

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
        cash: 0,
        usedMargin: 0,
      },
      update: {}, // No update needed, just fetch
    });

    // Available margin = cash (margin is already deducted from cash in trading operations)
    const availableMargin = account.cash;

    return res.status(200).json({
      success: true,
      account: {
        cash: account.cash,
        usedMargin: account.usedMargin,
        availableMargin,
        totalFunds: account.cash + account.usedMargin, // For transparency
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

    // Validate and parse amount
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
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
    const exchangeRate = settings?.exchangeRate || 1.0;

    // Calculate dummy money
    const dummyMoney = parsedAmount * exchangeRate;

    // Use upsert to atomically create or update account (prevents race condition)
    const account = await prisma.account.upsert({
      where: { userId },
      create: {
        userId,
        cash: dummyMoney,
        usedMargin: 0,
      },
      update: {
        cash: { increment: dummyMoney },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${parsedAmount} (received ₹${dummyMoney} dummy money)`,
      deposit: {
        realMoney: parsedAmount,
        exchangeRate,
        dummyMoney,
      },
      account: {
        cash: account.cash,
        usedMargin: account.usedMargin,
        availableMargin: account.cash, // Cash already excludes used margin
        totalFunds: account.cash + account.usedMargin,
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

    // Validate and parse amount
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
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

    // Available margin = cash (margin already deducted)
    const availableMargin = account.cash;

    if (parsedAmount > availableMargin) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds. Available: ₹${availableMargin.toFixed(
          2
        )}, Requested: ₹${parsedAmount.toFixed(2)}`,
      });
    }

    const updatedAccount = await prisma.account.update({
      where: { userId },
      data: {
        cash: { decrement: parsedAmount },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew ₹${parsedAmount}`,
      account: {
        cash: updatedAccount.cash,
        usedMargin: updatedAccount.usedMargin,
        availableMargin: updatedAccount.cash, // Cash already excludes used margin
        totalFunds: updatedAccount.cash + updatedAccount.usedMargin,
      },
    });
  } catch (error) {
    console.error("Error withdrawing funds:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to withdraw funds",
    });
  }
};
