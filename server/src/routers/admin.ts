import { getAllUsers, getDashboardData } from "@/controllers/admin";
import {
  seedInstrumentsEndpoint,
  syncInstrumentsEndpoint,
  getInstrumentStatus,
} from "@/controllers/admin/instruments";
import { getLeaderboard } from "@/controllers/admin/leaderboard";
import validToken from "@/middlewares/validToken";
import verifyAdmin from "@/middlewares/verifyAdmin";
import express from "express";

const AdminRouter = express.Router();

AdminRouter.use(validToken);

AdminRouter.use(verifyAdmin);

AdminRouter.get("/users", getAllUsers);

AdminRouter.get("/dashboard", getDashboardData);

AdminRouter.get("/leaderboard", getLeaderboard);

// Instrument management
AdminRouter.post("/instruments/seed", seedInstrumentsEndpoint);
AdminRouter.post("/instruments/sync", syncInstrumentsEndpoint);
AdminRouter.get("/instruments/status", getInstrumentStatus);

export default AdminRouter;
