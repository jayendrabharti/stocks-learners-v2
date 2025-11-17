import { Router } from "express";
import { getAccount, depositFunds, withdrawFunds } from "@/controllers/account";
import validToken from "@/middlewares/validToken";

const router = Router();

// All routes require authentication
router.use(validToken);

// Get account details
router.get("/", getAccount);

// Deposit funds (manual - for testing)
router.post("/deposit", depositFunds);

// Withdraw funds (manual - for testing)
router.post("/withdraw", withdrawFunds);

export default router;
