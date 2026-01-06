/**
 * Razorpay Payment Signature Verification
 * Shared utility for verifying payment signatures across all payment flows
 */

import crypto from "crypto";

export interface PaymentVerificationInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyRazorpaySignature(
  input: PaymentVerificationInput
): VerificationResult {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

  // Validate required fields
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return {
      valid: false,
      error: "Missing required payment verification fields",
    };
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("RAZORPAY_KEY_SECRET is not configured");
    return {
      valid: false,
      error: "Payment verification not configured",
    };
  }

  try {
    // Generate expected signature
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    // Check buffer lengths first (timing-safe compare requires equal lengths)
    if (expectedBuffer.length !== receivedBuffer.length) {
      return {
        valid: false,
        error: "Invalid payment signature",
      };
    }

    const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      return {
        valid: false,
        error: "Invalid payment signature",
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Signature verification error:", error);
    return {
      valid: false,
      error: "Signature verification failed",
    };
  }
}

/**
 * Generates an idempotency key for payment operations
 * Format: {purpose}_{userId}_{timestamp}_{random}
 */
export function generateIdempotencyKey(
  purpose: string,
  userId: string
): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex");
  return `${purpose}_${userId}_${timestamp}_${random}`;
}

/**
 * Validates idempotency key format
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  // Basic format validation: purpose_userId_timestamp_random
  const parts = key.split("_");
  return parts.length >= 4;
}
