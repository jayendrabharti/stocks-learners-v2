import { getAllUsers, getDashboardData, getAppSettings, updateExchangeRate } from "@/controllers/admin";
import {
  seedInstrumentsEndpoint,
  syncInstrumentsEndpoint,
  getInstrumentStatus,
} from "@/controllers/admin/instruments";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventDetails,
  getEventRegistrations,
  getEventLeaderboard,
} from "@/controllers/admin/events";
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

// App Settings
AdminRouter.get("/settings", getAppSettings);
AdminRouter.put("/settings/exchange-rate", updateExchangeRate);

// Events Management
AdminRouter.post("/events", createEvent);
AdminRouter.put("/events/:eventId", updateEvent);
AdminRouter.delete("/events/:eventId", deleteEvent);
AdminRouter.get("/events", getAllEvents);
AdminRouter.get("/events/:eventId", getEventDetails);
AdminRouter.get("/events/:eventId/registrations", getEventRegistrations);
AdminRouter.get("/events/:eventId/leaderboard", getEventLeaderboard);

// Instrument management
AdminRouter.post("/instruments/seed", seedInstrumentsEndpoint);
AdminRouter.post("/instruments/sync", syncInstrumentsEndpoint);
AdminRouter.get("/instruments/status", getInstrumentStatus);

export default AdminRouter;
