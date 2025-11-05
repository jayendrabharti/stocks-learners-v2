import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import InstrumentRouter from "./routers/instruments.js";
import { Search } from "./controllers/search.js";

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
      process.env.NODE_ENV === "production" && process.env.CLIENT_BASE_URL
        ? process.env.CLIENT_BASE_URL
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

app.get("/health", (_req, res) => {
  res
    .status(200)
    .json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.get("/search", Search);

app.use("/instruments", InstrumentRouter);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Trading Server is running on port ${PORT}`);
});
