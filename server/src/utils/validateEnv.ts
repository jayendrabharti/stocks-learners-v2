/**
 * Environment Variable Validation
 * Validates required environment variables on server startup
 */

export function validateRequiredEnvVars(): void {
  const required = [
    "DATABASE_URL",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
  ];

  const missing: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((env) => console.error(`   - ${env}`));
    console.error(
      "\n⚠️  Server may not function correctly. Please check your .env file."
    );

    // In production, fail hard
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  } else {
    console.log("✅ All required environment variables are set");
  }
}

/**
 * Validate secrets are not using default/weak values
 */
export function validateSecretStrength(): void {
  const secrets = {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  };

  for (const [name, value] of Object.entries(secrets)) {
    if (value && value.length < 32) {
      console.warn(
        `⚠️  ${name} is too short (< 32 characters). Use a stronger secret in production.`
      );
    }
  }
}
