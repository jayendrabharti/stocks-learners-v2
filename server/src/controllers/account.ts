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

    // Get or create account
    let account = await prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      // Create account with initial balance 0
      account = await prisma.account.create({
        data: {
          userId,
          cash: 0,
          usedMargin: 0,
        },
      });
    }

    // Calculate available margin
    const availableMargin = account.cash - account.usedMargin;

    return res.status(200).json({
      success: true,
      account: {
        cash: account.cash,
        usedMargin: account.usedMargin,
        availableMargin,
      },
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account details",
    });
  }
};

/**
 * Deposit funds (manual - for testing before payment integration)
 */
export const depositFunds = async (
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

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Get or create account
    let account = await prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await prisma.account.create({
        data: {
          userId,
          cash: amount,
          usedMargin: 0,
        },
      });
    } else {
      account = await prisma.account.update({
        where: { userId },
        data: {
          cash: account.cash + amount,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${amount}`,
      account: {
        cash: account.cash,
        usedMargin: account.usedMargin,
        availableMargin: account.cash - account.usedMargin,
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

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
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

    const availableMargin = account.cash - account.usedMargin;

    if (amount > availableMargin) {
      return res.status(400).json({
        success: false,
        message: "Insufficient available margin for withdrawal",
      });
    }

    // Ensure withdrawal doesn't result in negative cash
    const newCash = account.cash - amount;
    if (newCash < 0) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal would result in negative balance",
      });
    }

    const updatedAccount = await prisma.account.update({
      where: { userId },
      data: {
        cash: newCash,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew ₹${amount}`,
      account: {
        cash: updatedAccount.cash,
        usedMargin: updatedAccount.usedMargin,
        availableMargin: updatedAccount.cash - updatedAccount.usedMargin,
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
