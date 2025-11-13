import {
  addToWatchlist,
  getAllWatchlistItems,
  removeFromWatchlist,
} from "@/controllers/watchlist";
import validToken from "@/middlewares/validToken";
import express from "express";

const WatchlistRouter = express.Router();

WatchlistRouter.use(validToken);

WatchlistRouter.get("/", getAllWatchlistItems);

WatchlistRouter.post("/", addToWatchlist);

WatchlistRouter.delete("/", removeFromWatchlist);

export default WatchlistRouter;
