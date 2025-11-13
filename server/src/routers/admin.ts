import { getAllUsers, getDashboardData } from "@/controllers/admin";
import validToken from "@/middlewares/validToken";
import verifyAdmin from "@/middlewares/verifyAdmin";
import express from "express";

const AdminRouter = express.Router();

AdminRouter.use(validToken);

AdminRouter.use(verifyAdmin);

AdminRouter.get("/users", getAllUsers);

AdminRouter.get("/dashboard", getDashboardData);

export default AdminRouter;
