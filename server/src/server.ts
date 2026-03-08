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
import {
  healthCheck,
  deepHealthCheck,
  setShuttingDown,
  isShuttingDown,
} from "@/controllers/healthCheck";
import ProfileRouter from "@/routers/profile";
import MarketRouter from "@/routers/market";
import AdminRouter from "@/routers/admin";
import ContactRouter from "@/routers/contact";
import WatchlistRouter from "@/routers/watchlist";
import TradingRouter from "@/routers/trading";
import AccountRouter from "@/routers/account";
import PortfolioRouter from "@/routers/portfolio";
import { scheduleDailyInstrumentSync } from "@/utils/instruments";
import {
  initializeAutoSquareOffJobs,
  stopAutoSquareOffJobs,
} from "@/jobs/autoSquareOffJob";
import EventsRouter from "./routers/events";
import EventTradingRouter from "./routers/eventTrading";
import SettingsRouter from "./routers/settings";
import prisma from "@/database/client";
import {
  validateRequiredEnvVars,
  validateSecretStrength,
} from "@/utils/validateEnv";

dotenv.config();

validateRequiredEnvVars();
validateSecretStrength();

const app = express();

const PORT = process.env.PORT || 8080;
const GRACEFUL_SHUTDOWN_TIMEOUT = parseInt(
  process.env.GRACEFUL_SHUTDOWN_TIMEOUT || "30000",
  10,
);

// Track active connections for graceful shutdown
let server: ReturnType<typeof app.listen>;
let activeConnections = new Set<any>();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV !== "development" && clientBaseUrl
        ? clientBaseUrl
        : (origin, callback) => {
            if (!origin) return callback(null, true);
            return callback(null, origin);
          },
    credentials: true,
  }),
);

// Reject new requests during shutdown
app.use((_req, res, next) => {
  if (isShuttingDown) {
    res.setHeader("Connection", "close");
    res.status(503).json({
      error: { message: "Server is shutting down" },
    });
    return;
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.get("/", (_req, res) => {
  res.send(`This is your Trading API`);
});

app.get("/health", healthCheck);
app.get("/health/deep", deepHealthCheck);
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
app.use("/events", EventsRouter);
app.use("/events", EventTradingRouter);
app.use("/settings", SettingsRouter);

/**
 * Graceful shutdown handler
 * Properly closes connections and cleans up resources
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} signal received: initiating graceful shutdown`);
  setShuttingDown(true);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log("HTTP server closed");
    });
  }

  // Stop background jobs
  stopAutoSquareOffJobs();
  console.log("Background jobs stopped");

  // Close active connections with timeout
  const shutdownPromise = new Promise<void>((resolve) => {
    if (activeConnections.size === 0) {
      resolve();
      return;
    }

    console.log(
      `Waiting for ${activeConnections.size} active connections to close...`,
    );

    // Force close connections after timeout
    setTimeout(() => {
      console.log("Forcing remaining connections to close");
      activeConnections.forEach((conn) => {
        try {
          conn.destroy();
        } catch (e) {
          // Ignore errors during force close
        }
      });
      resolve();
    }, GRACEFUL_SHUTDOWN_TIMEOUT - 5000);
  });

  try {
    await shutdownPromise;

    // Disconnect from database
    await prisma.$disconnect();
    console.log("Database connection closed");

    console.log("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit on unhandled rejection, just log it
});

server = app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`🚀 Trading Server is running on port ${PORT}`);

  scheduleDailyInstrumentSync();
  console.log("📅 Instrument sync scheduler initialized");

  initializeAutoSquareOffJobs();
  console.log("⏰ Auto square-off scheduler initialized");
});

// Track connections for graceful shutdown
server.on("connection", (conn) => {
  activeConnections.add(conn);
  conn.on("close", () => {
    activeConnections.delete(conn);
  });
});
