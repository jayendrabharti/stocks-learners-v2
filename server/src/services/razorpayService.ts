/**
 * Razorpay Service
 * Payment integration for event registrations
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "@/database/client.js";
import type { PaymentStatus } from "@/database/generated/enums.js";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export interface CreateOrderOptions {
  amount: number; // in rupees
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

/**
 * Create a Razorpay order
 */
export async function createOrder(
  options: CreateOrderOptions
): Promise<CreateOrderResult> {
  try {
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(options.amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: options.currency || "INR",
      receipt: options.receipt || `receipt_${Date.now()}`,
      notes: options.notes || {},
    });

    return {
      orderId: order.id,
      amount: Number(order.amount) / 100, // Convert back to rupees
      currency: order.currency || "INR",
      receipt: order.receipt || "",
    };
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    throw new Error(
      `Failed to create payment order: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || "";

    // Generate expected signature
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Compare signatures
    return generatedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Log payment to database
 */
export async function logPayment(data: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  purpose: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId || null,
        razorpaySignature: data.razorpaySignature || null,
        amount: data.amount,
        currency: data.currency || "INR",
        status: data.status,
        purpose: data.purpose,
        referenceId: data.referenceId || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
    });

    return payment;
  } catch (error) {
    console.error("Payment logging error:", error);
    throw new Error("Failed to log payment");
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  razorpayOrderId: string,
  status: PaymentStatus,
  paymentId?: string,
  signature?: string
) {
  try {
    const payment = await prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        status,
        ...(paymentId && { razorpayPaymentId: paymentId }),
        ...(signature && { razorpaySignature: signature }),
        updatedAt: new Date(),
      },
    });

    return payment;
  } catch (error) {
    console.error("Payment status update error:", error);
    throw new Error("Failed to update payment status");
  }
}

/**
 * Get payment by order ID
 */
export async function getPaymentByOrderId(razorpayOrderId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    return payment;
  } catch (error) {
    console.error("Get payment error:", error);
    return null;
  }
}

/**
 * Capture payment (for authorized payments)
 */
export async function capturePayment(
  paymentId: string,
  amount: number,
  currency: string = "INR"
) {
  try {
    const amountInPaise = Math.round(amount * 100);

    const payment = await razorpay.payments.capture(
      paymentId,
      amountInPaise,
      currency
    );

    return payment;
  } catch (error) {
    console.error("Payment capture error:", error);
    throw new Error("Failed to capture payment");
  }
}

/**
 * Refund payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
) {
  try {
    const refundData: any = {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes: notes || {},
    };

    // Use payments.refund instead of refunds.create
    const refund = await razorpay.payments.refund(paymentId, refundData);

    return refund;
  } catch (error) {
    console.error("Refund error:", error);
    throw new Error("Failed to process refund");
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(webhookBody)
      .digest("hex");

    return expectedSignature === webhookSignature;
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}
