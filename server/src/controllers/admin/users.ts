/**
 * Admin User Management Controller
 * Handles fund adjustments and user management with full audit logging
 */

import prisma from "@/database/client";
import { Request, Response } from "express";
import { roundCurrency, fromDecimal, toDecimal } from "@/utils/currency";

interface AdjustFundsBody {
  amount: number;
  reason: string;
  type: "ADD" | "DEDUCT";
}

/**
 * Adjust user funds (add or deduct)
 * POST /admin/users/:userId/funds/adjust
 */
export const adjustUserFunds = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, reason, type } = req.body as AdjustFundsBody;
    const adminId = req.user?.id;

    // Validation
    if (!adminId) {
      return res.status(401).json({
        error: { message: "Admin authentication required" },
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: { message: "User ID is required" },
      });
    }

    if (typeof amount !== "number" || amount <= 0 || !isFinite(amount)) {
      return res.status(400).json({
        error: { message: "Amount must be a positive number" },
      });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return res.status(400).json({
        error: { message: "A reason (at least 3 characters) is required for audit purposes" },
      });
    }

    if (!type || !["ADD", "DEDUCT"].includes(type)) {
      return res.status(400).json({
        error: { message: "Type must be either 'ADD' or 'DEDUCT'" },
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(404).json({
        error: { message: "User not found" },
      });
    }

    // Perform fund adjustment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get or create user account
      let account = await tx.account.findUnique({
        where: { userId },
      });

      if (!account) {
        // Create account with initial balance if adjusting
        account = await tx.account.create({
          data: {
            userId,
            cash: type === "ADD" ? toDecimal(roundCurrency(amount)) : toDecimal(0),
            usedMargin: toDecimal(0),
          },
        });

        if (type === "DEDUCT") {
          throw new Error("Cannot deduct from an account with zero balance");
        }
      } else {
        const currentCash = fromDecimal(account.cash);
        const adjustedAmount = roundCurrency(amount);

        if (type === "DEDUCT") {
          if (currentCash < adjustedAmount) {
            throw new Error(
              `Insufficient funds. User has ₹${currentCash.toFixed(2)} but attempted to deduct ₹${adjustedAmount.toFixed(2)}`
            );
          }
        }

        const newCash =
          type === "ADD"
            ? roundCurrency(currentCash + adjustedAmount)
            : roundCurrency(currentCash - adjustedAmount);

        account = await tx.account.update({
          where: { userId },
          data: { cash: toDecimal(newCash) },
        });
      }

      // Create audit log entry
      const auditLog = await tx.adminAuditLog.create({
        data: {
          adminId,
          action: "ADJUST_FUNDS",
          targetType: "ACCOUNT",
          targetId: account.id,
          description: `${type === "ADD" ? "Added" : "Deducted"} ₹${roundCurrency(amount).toFixed(2)} ${type === "ADD" ? "to" : "from"} ${user.email}'s account. Reason: ${reason.trim()}`,
          oldValue: {
            cash: type === "ADD" 
              ? fromDecimal(account.cash) - roundCurrency(amount)
              : fromDecimal(account.cash) + roundCurrency(amount),
          },
          newValue: {
            cash: fromDecimal(account.cash),
          },
          metadata: {
            userId: user.id,
            userEmail: user.email,
            adjustmentType: type,
            amount: roundCurrency(amount),
            reason: reason.trim(),
          },
          ipAddress: req.ip || req.headers["x-forwarded-for"]?.toString() || null,
          userAgent: req.headers["user-agent"] || null,
        },
      });

      return { account, auditLog };
    });

    return res.status(200).json({
      message: `Successfully ${type === "ADD" ? "added" : "deducted"} ₹${roundCurrency(amount).toFixed(2)} ${type === "ADD" ? "to" : "from"} user's account`,
      account: {
        id: result.account.id,
        userId: result.account.userId,
        cash: fromDecimal(result.account.cash),
        usedMargin: fromDecimal(result.account.usedMargin),
      },
      auditLogId: result.auditLog.id,
    });
  } catch (error) {
    console.error("Error adjusting user funds:", error);
    const message =
      error instanceof Error ? error.message : "Error adjusting user funds";
    return res.status(500).json({
      error: { message },
    });
  }
};

/**
 * Get user account details
 * GET /admin/users/:userId/account
 */
export const getUserAccount = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: { message: "User ID is required" },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isAdmin: true,
        createdAt: true,
        account: true,
        _count: {
          select: {
            positions: { where: { isOpen: true } },
            transactions: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: { message: "User not found" },
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      },
      account: user.account
        ? {
            id: user.account.id,
            cash: fromDecimal(user.account.cash),
            usedMargin: fromDecimal(user.account.usedMargin),
            availableBalance:
              fromDecimal(user.account.cash) - fromDecimal(user.account.usedMargin),
          }
        : null,
      stats: {
        openPositions: user._count.positions,
        totalTransactions: user._count.transactions,
      },
    });
  } catch (error) {
    console.error("Error getting user account:", error);
    return res.status(500).json({
      error: { message: "Error retrieving user account" },
    });
  }
};

/**
 * Get audit logs with filtering
 * GET /admin/audit-logs
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      action,
      targetType,
      targetId,
      adminId,
      page = "1",
      limit = "50",
    } = req.query;

    // Build where clause
    const where: any = {};

    if (action && typeof action === "string") {
      where.action = action;
    }

    if (targetType && typeof targetType === "string") {
      where.targetType = targetType;
    }

    if (targetId && typeof targetId === "string") {
      where.targetId = targetId;
    }

    if (adminId && typeof adminId === "string") {
      where.adminId = adminId;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return res.status(200).json({
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting audit logs:", error);
    return res.status(500).json({
      error: { message: "Error retrieving audit logs" },
    });
  }
};
