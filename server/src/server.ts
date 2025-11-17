import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Search } from "@/controllers/search";
import InstrumentRouter from "@/routers/instruments";
import { clientBaseUrl } from "@/utils/auth";
import AuthRouter from "@/routers/auth";
import { GetMetadata } from "@/controllers/metadata";
import { healthCheck } from "@/controllers/healthCheck";
import ProfileRouter from "@/routers/profile";
import MarketRouter from "@/routers/market";
import AdminRouter from "@/routers/admin";
import ContactRouter from "@/routers/contact";
import WatchlistRouter from "./routers/watchlist";
import TradingRouter from "./routers/trading";
import AccountRouter from "./routers/account";
import PortfolioRouter from "./routers/portfolio";
import { scheduleDailyInstrumentSync } from "@/utils/instruments";
import {
  initializeAutoSquareOffJobs,
  stopAutoSquareOffJobs,
} from "@/jobs/autoSquareOffJob";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 8080;

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV !== "development" && clientBaseUrl
        ? clientBaseUrl
        : (origin, callback) => {
            // In development, allow any origin for flexibility
            // In production, only allow CLIENT_BASE_URL
            if (!origin) return callback(null, true);
            return callback(null, origin);
          },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send(`This is your Trading API`);
});

app.get("/health", healthCheck);
app.use("/auth", AuthRouter);
app.get("/search", Search);
app.get("/metadata", GetMetadata);
app.use("/instruments", InstrumentRouter);
app.use("/profile", ProfileRouter);
app.use("/market", MarketRouter);
app.use("/admin", AdminRouter);
app.use("/contact", ContactRouter);
app.use("/watchlist", WatchlistRouter);
app.use("/trading", TradingRouter);
app.use("/account", AccountRouter);
app.use("/portfolio", PortfolioRouter);

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  stopAutoSquareOffJobs();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  stopAutoSquareOffJobs();
  process.exit(0);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Trading Server is running on port ${PORT}`);

  // Initialize daily instrument sync scheduler
  scheduleDailyInstrumentSync();
  console.log("📅 Instrument sync scheduler initialized");

  // Initialize auto square-off jobs
  initializeAutoSquareOffJobs();
  console.log("⏰ Auto square-off scheduler initialized");
});
