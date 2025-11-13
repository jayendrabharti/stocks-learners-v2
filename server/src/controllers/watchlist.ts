import prisma from "@/database/client";
import { getErrorMessage } from "@/utils";
import { Request, Response } from "express";

export const getAllWatchlistItems = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(500).json({
        error: {
          message: "User id not found",
        },
      });
    }

    const watchlistItems = await prisma.watchlistItem.findMany({
      where: {
        userId: req.user.id,
      },
    });
    return res.status(200).json({ watchlistItems });
  } catch (error) {
    return res
      .status(500)
      .json({ error: { message: "Error retrieving users" } });
  }
};

export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const { searchId, tradingSymbol, instrumentType } = req.body;

    const userId = req.user?.id;

    if (!userId || !searchId || !instrumentType) {
      return res.status(500).json({
        error: {
          message: "UserId, searchId, or instrumentType not found",
        },
      });
    }

    if (instrumentType !== "IDX" && instrumentType !== "EQ" && !tradingSymbol) {
      return res.status(500).json({
        error: {
          message: "TradingSymbol is required for this instrument type",
        },
      });
    }

    const newWatchlistItem = await prisma.watchlistItem.create({
      data: {
        userId,
        searchId,
        tradingSymbol: tradingSymbol || null,
        instrumentType,
      },
    });

    console.log("3");

    return res.status(201).json({ newWatchlistItem });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: getErrorMessage(error, "Couldn't add to watchlist."),
      },
    });
  }
};

export const removeFromWatchlist = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (typeof id !== "string" || !req.user?.id) {
      return res.status(500).json({
        error: {
          message: "Watchlist item id or user id not found",
        },
      });
    }
    await prisma.watchlistItem.deleteMany({
      where: {
        id,
        userId: req.user.id,
      },
    });
    return res
      .status(200)
      .json({ success: true, message: "Watchlist item removed successfully" });
  } catch (error) {
    return res.status(500).json({
      error: {
        message: getErrorMessage(error, "Couldn't remove from watchlist."),
      },
    });
  }
};
