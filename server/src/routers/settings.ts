import { getAppSettings } from "@/controllers/admin";
import express from "express";

const SettingsRouter = express.Router();

// Public settings endpoint
SettingsRouter.get("/", getAppSettings);

export default SettingsRouter;
