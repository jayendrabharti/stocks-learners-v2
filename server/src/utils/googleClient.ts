import { OAuth2Client } from "google-auth-library";
import {
  googleClientId,
  googleClientSecret,
  serverBaseUrl,
} from "@/utils/auth";

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Missing Google OAuth credentials. Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables."
  );
}

export const oAuth2Client = new OAuth2Client({
  clientId: googleClientId,
  clientSecret: googleClientSecret,
  redirectUri: `${serverBaseUrl}/auth/google/callback`,
});
