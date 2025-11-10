import {
  emailLogin,
  emailVerify,
  getNewAccessToken,
  getUser,
  googleAuthCallback,
  googleAuthUrl,
  logoutUser,
  refreshUserToken,
  updateUser,
} from "@/controllers/auth";
import validToken from "@/middlewares/validToken";
import express from "express";

const AuthRouter = express.Router();

AuthRouter.get("/user", validToken, getUser);
AuthRouter.post("/user", validToken, updateUser);
AuthRouter.post("/logout", validToken, logoutUser);

AuthRouter.post("/refresh", refreshUserToken);
AuthRouter.get("/refresh", getNewAccessToken);

AuthRouter.post("/email/login", emailLogin);
AuthRouter.post("/email/verify", emailVerify);

AuthRouter.get("/google/url", googleAuthUrl);
AuthRouter.get("/google/callback", googleAuthCallback);

export default AuthRouter;
