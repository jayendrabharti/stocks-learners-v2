import { Router } from "express";
import { getAccount } from "@/controllers/account";
import validToken from "@/middlewares/validToken";

const router = Router();

// All routes require authentication
router.use(validToken);

// Get account details
router.get("/", getAccount);

export default router;
