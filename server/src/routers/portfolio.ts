import { Router } from "express";
import { getPortfolio } from "@/controllers/portfolio";
import validToken from "@/middlewares/validToken";

const router = Router();

// All routes require authentication
router.use(validToken);

// Get complete portfolio summary
router.get("/", getPortfolio);

export default router;
