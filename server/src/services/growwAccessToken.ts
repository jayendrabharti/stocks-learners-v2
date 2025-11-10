import prisma from "@/database/client.js";
import { createHash } from "crypto";
import { authenticator } from "otplib";

export interface GrowwTokenResponse {
  success: boolean;
  access_token: string | null;
  expiry: Date | null;
  error: string | null;
}

export interface GrowwAPITokenData {
  token: string;
  tokenRefId?: string;
  sessionName?: string;
  expiry: string; // ISO format: "2024-07-01T12:34:56"
  isActive?: boolean;
}

export interface GrowwAPIError {
  code: string;
  message: string;
}

export class GrowwAPIException extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GrowwAPIException";
    this.code = code;
  }
}

export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
  }
}

export default async function getGrowwAccessToken(): Promise<string | null> {
  try {
    // Try to get token from database
    const dbToken = await prisma.growwAccessToken.findUnique({
      where: { id: 1 },
    });

    // Check if token exists and is not expired
    const isExpired =
      !dbToken ||
      !dbToken.expiresAt ||
      dbToken.expiresAt.getTime() < Date.now();

    if (!isExpired && dbToken?.token) {
      // Return valid cached token from database
      console.log(
        `🔄 Using cached Groww token. Expires at: ${dbToken.expiresAt.toLocaleString()}`
      );
      return dbToken.token;
    }

    // Token is expired or doesn't exist, get new token from API
    console.log("🔄 Token expired or missing, fetching new token...");
    const result = await getNewGrowwAccessToken();

    if (!result.success || !result.access_token || !result.expiry) {
      console.error("❌ Failed to get new access token:", result.error);
      return null;
    }

    // Use expiry from Groww API response
    const expiresAt = result.expiry;

    // Save new token to database
    await prisma.growwAccessToken.upsert({
      where: { id: 1 },
      update: {
        token: result.access_token,
        expiresAt: expiresAt,
      },
      create: {
        id: 1,
        token: result.access_token,
        expiresAt: expiresAt,
      },
    });

    console.log(
      `🔑 New Groww access token saved. Expires at: ${expiresAt.toLocaleString()}`
    );

    // Return the new token from database
    return result.access_token;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";
    console.error("❌ Database error while getting Groww token:", errorMessage);

    // Fallback: try to get token without database caching
    console.warn("⚠️ Attempting to generate token without database caching...");
    const result = await getNewGrowwAccessToken();

    if (result.success && result.access_token) {
      console.log("✅ Token generated successfully (not cached in database)");
      return result.access_token;
    }

    console.error("❌ Failed to generate token:", result.error);
    return null;
  }
}

// Constants for Groww API
const API_URL = "https://api.groww.in/v1/token/api/access";
const CLIENT_ID = "growwapi";
const CLIENT_PLATFORM = "growwapi-typescript-client";
const CLIENT_PLATFORM_VERSION = "1.0.0";
const API_VERSION = "1.0";

const ERROR_MAP: Record<number, () => GrowwAPIException> = {
  401: () =>
    new GrowwAPIException("401", "Unauthorized: Invalid API key or token"),
  403: () => new GrowwAPIException("403", "Forbidden: Access denied"),
  404: () => new GrowwAPIException("404", "Not Found: Resource not found"),
  429: () =>
    new GrowwAPIException("429", "Too Many Requests: Rate limit exceeded"),
  500: () => new GrowwAPIException("500", "Internal Server Error"),
  502: () => new GrowwAPIException("502", "Bad Gateway"),
  503: () => new GrowwAPIException("503", "Service Unavailable"),
  504: () => new GrowwAPIException("504", "Gateway Timeout"),
};

function generateChecksum(data: string, salt: string): string {
  const inputStr = data + salt;
  return createHash("sha256").update(inputStr, "utf-8").digest("hex");
}

function buildRequestData(totp?: string, secret?: string): object {
  // Validation: both or neither provided
  if (totp !== undefined && secret !== undefined) {
    throw new ValueError("Either totp or secret should be provided, not both.");
  }
  if (totp === undefined && secret === undefined) {
    throw new ValueError("Either totp or secret should be provided.");
  }

  // TOTP authentication
  if (totp !== undefined) {
    if (!totp.trim()) {
      throw new ValueError("TOTP cannot be empty");
    }

    return {
      key_type: "totp",
      totp: totp.trim(),
    };
  }

  // Approval authentication (secret is not undefined)
  if (!secret!.trim()) {
    throw new ValueError("Secret cannot be empty");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const checksum = generateChecksum(secret!, timestamp.toString());

  return {
    key_type: "approval",
    checksum,
    timestamp,
  };
}

/**
 * Get access token from Groww API
 * @param apiKey Bearer token or API key for the Authorization header
 * @param totp TOTP code as a string (if using TOTP authentication)
 * @param secret Secret value as a string (if using approval authentication)
 * @returns Promise<GrowwAPITokenData> The access token data including expiry
 */
async function getAccessTokenFromAPI(
  apiKey: string,
  totp?: string,
  secret?: string
): Promise<GrowwAPITokenData> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "x-client-id": CLIENT_ID,
    "x-client-platform": CLIENT_PLATFORM,
    "x-client-platform-version": CLIENT_PLATFORM_VERSION,
    "x-api-version": API_VERSION,
  };

  const data = buildRequestData(totp, secret);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    // Handle 400 Bad Request specifically
    if (response.status === 400) {
      let msg = "Bad Request";
      try {
        const errorResponse = await response.json();
        msg = (errorResponse as any)?.error?.displayMessage || "Bad Request";
      } catch {
        // If JSON parsing fails, use default message
      }
      throw new GrowwAPIException("400", `Groww API Error 400: ${msg}`);
    }

    // Handle other known error status codes
    if (response.status in ERROR_MAP) {
      const errorFactory = ERROR_MAP[response.status];
      if (errorFactory) {
        throw errorFactory();
      }
    }

    // Handle any other non-OK responses
    if (!response.ok) {
      throw new GrowwAPIException(
        response.status.toString(),
        "The request to the Groww API failed."
      );
    }

    const result = (await response.json()) as GrowwAPITokenData;
    return result;
  } catch (error) {
    if (error instanceof GrowwAPIException) {
      throw error;
    }

    // Handle network errors, timeouts, etc.
    throw new GrowwAPIException(
      "NETWORK_ERROR",
      `Network error occurred: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

function generateTOTP(secret: string): string {
  return authenticator.generate(secret);
}

/**
 * Main function to get new Groww access token
 * Uses environment variables for API credentials
 * @returns Promise<GrowwTokenResponse>
 */
const getNewGrowwAccessToken = async (): Promise<GrowwTokenResponse> => {
  try {
    // Get credentials from environment variables
    const apiKey = process.env.GROWW_API_KEY;
    const apiSecret = process.env.GROWW_API_SECRET;

    if (!apiKey || !apiSecret) {
      return {
        success: false,
        access_token: null,
        expiry: null,
        error:
          "GROWW_API_KEY and GROWW_API_SECRET environment variables are required",
      };
    }

    // Generate TOTP code
    const totp = generateTOTP(apiSecret);

    // Get access token with expiry data
    const tokenData = await getAccessTokenFromAPI(apiKey, totp);

    // Parse expiry from ISO string to Date
    const expiryDate = new Date(tokenData.expiry);

    return {
      success: true,
      access_token: tokenData.token,
      expiry: expiryDate,
      error: null,
    };
  } catch (error) {
    let errorMessage = "Unknown error occurred";

    if (error instanceof GrowwAPIException) {
      errorMessage = `${error.code}: ${error.message}`;
    } else if (error instanceof ValueError) {
      errorMessage = `Validation Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      access_token: null,
      expiry: null,
      error: errorMessage,
    };
  }
};

export async function testGrowwToken(): Promise<void> {
  console.log("🧪 Testing Groww API Token Generation...");

  const result = await getNewGrowwAccessToken();

  if (result.success) {
    console.log("✅ Access token obtained successfully:", result.access_token);
  } else {
    console.error("❌ Failed to get access token:", result.error);
  }
}
