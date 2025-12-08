/**
 * Events Router
 * User-facing event endpoints
 */

import express from "express";
import validToken from "@/middlewares/validToken.js";
import optionalToken from "@/middlewares/optionalToken.js";
import {
  getActiveEvents,
  getEventDetails,
  registerForEvent,
  getUserEventRegistrations,
  getEventLeaderboard,
} from "@/controllers/events.js";

const EventsRouter = express.Router();

// Public routes (no auth required)
EventsRouter.get("/", optionalToken, getActiveEvents);

// Protected routes (auth required) - MUST come before /:eventId
EventsRouter.get("/my-registrations", validToken, getUserEventRegistrations);

// Public routes with params - MUST come after specific routes
EventsRouter.get("/:eventId", getEventDetails);
EventsRouter.get("/:eventId/leaderboard", getEventLeaderboard);

// Protected routes with params
EventsRouter.post("/:eventId/register", validToken, registerForEvent);

export default EventsRouter;
