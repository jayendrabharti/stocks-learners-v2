/**
 * Payment Controller
 * Handles payment creation, verification, and fund deposits
 * Implements idempotency and proper signature verification
 */

import prisma from "@/database/client";
import { getErrorMessage } from "@/utils";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { verifyPaymentSchema, verifyDepositSchema } from "@/utils/validation";
import {
  verifyRazorpaySignature,
  generateIdempotencyKey,
} from "@/utils/payment";
import {
  roundCurrency,
  fromDecimal,
  toDecimal,
  parseAmount,
} from "@/utils/currency";
import { Prisma } from "@/database/generated/client";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Constants
const MIN_DEPOSIT_AMOUNT = 10; // ₹10
const MAX_DEPOSIT_AMOUNT = 100000; // ₹1,00,000

/**
 * Create a Razorpay order for wallet deposit
 * POST /payment/create-order
 * Body: { amount: number, idempotencyKey?: string }
 * Also supports query params for backward compatibility
 */
export const CreateOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required" },
      });
    }

    // Support both query params (legacy) and body
    const rawAmount = req.body.amount || req.query.amount;
    const idempotencyKey = req.body.idempotencyKey || req.query.idempotencyKey;

    // Parse and validate amount
    const amount = parseAmount(rawAmount);
    if (amount === null) {
      return res.status(400).json({
        success: false,
        error: { message: "Invalid amount. Must be a positive number" },
      });
    }

    if (amount < MIN_DEPOSIT_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: { message: `Minimum deposit amount is ₹${MIN_DEPOSIT_AMOUNT}` },
      });
    }

    if (amount > MAX_DEPOSIT_AMOUNT) {
      return res.status(400).json({
        success: false,
        error: { message: `Maximum deposit amount is ₹${MAX_DEPOSIT_AMOUNT}` },
      });
    }

    // Generate idempotency key if not provided
    const finalIdempotencyKey =
      idempotencyKey || generateIdempotencyKey("wallet", userId);

    // Check for existing order with same idempotency key (prevents duplicate orders)
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey: finalIdempotencyKey },
    });

    if (existingPayment) {
      // Return existing order if found
      return res.status(200).json({
        success: true,
        order: {
          id: existingPayment.razorpayOrderId,
          amount: Number(fromDecimal(existingPayment.amount)) * 100,
          currency: existingPayment.currency,
        },
        idempotencyKey: finalIdempotencyKey,
        message: "Existing order returned",
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: `wallet_${userId}_${Date.now()}`,
      notes: {
        purpose: "FUND_DEPOSIT",
        userId,
        idempotencyKey: finalIdempotencyKey,
      },
    });

    // Pre-create payment record in PENDING state
    await prisma.payment.create({
      data: {
        userId,
        razorpayOrderId: order.id,
        amount: toDecimal(amount),
        currency: "INR",
        status: "PENDING",
        purpose: "FUND_DEPOSIT",
        idempotencyKey: finalIdempotencyKey,
        metadata: {
          createdAt: new Date().toISOString(),
          userAgent: req.headers["user-agent"],
        },
      },
    });

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      idempotencyKey: finalIdempotencyKey,
    });
  } catch (error) {
    console.error("CreateOrder error:", error);
    return res.status(500).json({
      success: false,
      error: {
        message: getErrorMessage(error) || "Failed to create order",
      },
    });
  }
};

/**
 * Verify payment and deposit funds with idempotency
 * POST /payment/verify-order
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const VerifyOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    // Validate input - support both body (new) and query params (legacy)
    const inputData = {
      razorpay_order_id: req.body.razorpay_order_id || req.query.order_id,
      razorpay_payment_id: req.body.razorpay_payment_id || req.query.payment_id,
      razorpay_signature: req.body.razorpay_signature || req.query.signature,
    };

    const validation = verifyDepositSchema.safeParse(inputData);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.error.issues[0]?.message || "Invalid input",
        },
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      validation.data;

    // Verify signature
    const signatureResult = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!signatureResult.valid) {
      console.error(
        `Signature verification failed for payment ${razorpay_payment_id}:`,
        signatureResult.error
      );
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SIGNATURE",
          message: signatureResult.error || "Payment verification failed",
        },
      });
    }

    // Execute in serializable transaction for idempotency
    const result = await prisma.$transaction(
      async (tx) => {
        // Check for existing completed payment (idempotency check)
        const existingPayment = await tx.payment.findFirst({
          where: {
            razorpayPaymentId: razorpay_payment_id,
            status: "COMPLETED",
          },
        });

        if (existingPayment) {
          // Already processed - return success (idempotent response)
          return {
            alreadyProcessed: true,
            depositedAmount: fromDecimal(existingPayment.depositedAmount),
            exchangeRate: fromDecimal(existingPayment.exchangeRate),
          };
        }

        // Find the pending payment record
        const payment = await tx.payment.findFirst({
          where: {
            razorpayOrderId: razorpay_order_id,
            userId,
          },
        });

        if (!payment) {
          throw new Error("Payment record not found");
        }

        if (payment.status === "COMPLETED") {
          // Double-check idempotency
          return {
            alreadyProcessed: true,
            depositedAmount: fromDecimal(payment.depositedAmount),
            exchangeRate: fromDecimal(payment.exchangeRate),
          };
        }

        // Verify payment with Razorpay (additional security)
        const razorpayPayment = await razorpay.payments.fetch(
          razorpay_payment_id
        );

        if (razorpayPayment.status !== "captured") {
          throw new Error(
            `Payment not captured. Status: ${razorpayPayment.status}`
          );
        }

        // Get exchange rate
        const settings = await tx.appSettings.findFirst();
        const exchangeRate = settings
          ? fromDecimal(settings.exchangeRate)
          : 1.0;

        // Validate exchange rate is positive (prevents zero/negative fund deposits)
        if (!exchangeRate || exchangeRate <= 0 || !isFinite(exchangeRate)) {
          throw new Error(
            "Invalid exchange rate configuration. Please contact support."
          );
        }

        // Calculate deposited amount
        const realAmount = fromDecimal(payment.amount);
        const depositedAmount = roundCurrency(realAmount * exchangeRate);

        // Update payment record
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            status: "COMPLETED",
            depositedAmount: toDecimal(depositedAmount),
            exchangeRate: toDecimal(exchangeRate),
            updatedAt: new Date(),
          },
        });

        // Verify user exists
        const user = await tx.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new Error("User not found");
        }

        // Deposit funds to account
        await tx.account.upsert({
          where: { userId },
          create: {
            userId,
            cash: toDecimal(depositedAmount),
            usedMargin: toDecimal(0),
          },
          update: {
            cash: { increment: depositedAmount },
          },
        });

        return {
          alreadyProcessed: false,
          depositedAmount,
          exchangeRate,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000, // 30 seconds
      }
    );

    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? "Payment already processed"
        : "Payment verified and funds deposited",
      depositedAmount: result.depositedAmount,
      exchangeRate: result.exchangeRate,
    });
  } catch (error) {
    console.error("VerifyOrder error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "VERIFICATION_FAILED",
        message: getErrorMessage(error) || "Failed to verify payment",
      },
    });
  }
};

/**
 * Verify event payment and create registration
 * POST /payment/event/verify
 */
export const verifyEventPayment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validated = verifyPaymentSchema.parse(req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      validated;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    // Verify signature using shared utility
    const signatureResult = verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!signatureResult.valid) {
      return res.status(400).json({
        error: {
          message: signatureResult.error || "Invalid payment signature",
        },
      });
    }

    // Fetch the Razorpay order to get event details
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const eventId = razorpayOrder.notes?.eventId as string;

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID not found in order" },
      });
    }

    // Execute all operations in a serializable transaction
    const registration = await prisma.$transaction(
      async (tx) => {
        // Get event details with registration count
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: { registrations: { where: { status: "CONFIRMED" } } },
            },
          },
        });

        if (!event) {
          throw new Error("Event not found");
        }

        // Check if already registered (inside transaction for atomicity)
        const existingRegistration = await tx.eventRegistration.findUnique({
          where: {
            userId_eventId: { userId, eventId: event.id },
          },
        });

        if (existingRegistration) {
          if (existingRegistration.status === "CONFIRMED") {
            // Idempotent response - already registered
            return {
              alreadyRegistered: true,
              registration: existingRegistration,
            };
          }
        }

        // Check max participants (atomic check inside transaction)
        if (event.maxParticipants !== null) {
          const confirmedCount = event._count.registrations;
          if (confirmedCount >= event.maxParticipants) {
            throw new Error("Event is full");
          }
        }

        // Create or update registration with CONFIRMED status
        const newRegistration = await tx.eventRegistration.upsert({
          where: {
            userId_eventId: { userId, eventId: event.id },
          },
          create: {
            userId,
            eventId: event.id,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentStatus: "COMPLETED",
            amountPaid: event.registrationFee,
            status: "CONFIRMED",
          },
          update: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentStatus: "COMPLETED",
            status: "CONFIRMED",
          },
        });

        // Update payment log
        await tx.payment.updateMany({
          where: { razorpayOrderId: razorpay_order_id },
          data: {
            status: "COMPLETED",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            referenceId: newRegistration.id,
          },
        });

        // Create event account (if not exists)
        await tx.eventAccount.upsert({
          where: { registrationId: newRegistration.id },
          create: {
            registrationId: newRegistration.id,
            cash: event.initialBalance,
            usedMargin: toDecimal(0),
          },
          update: {}, // No update needed
        });

        return { alreadyRegistered: false, registration: newRegistration };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000,
      }
    );

    return res.status(200).json({
      message: registration.alreadyRegistered
        ? "Already registered for this event"
        : "Payment verified successfully",
      registration: {
        id: registration.registration.id,
        status: "CONFIRMED",
        eventId: registration.registration.eventId,
      },
    });
  } catch (error) {
    console.error("Error verifying event payment:", error);
    return res.status(500).json({
      error: { message: getErrorMessage(error) || "Error verifying payment" },
    });
  }
};

/**
 * Verify event payment from Payment Link callback
 * GET /payment/event/verify-link
 * Query: { razorpay_payment_link_id, razorpay_payment_link_reference_id, razorpay_payment_link_status, razorpay_payment_id, razorpay_signature }
 */
export const verifyEventPaymentLink = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_payment_link_id,
      razorpay_payment_link_reference_id,
      razorpay_payment_link_status,
      razorpay_payment_id,
      razorpay_signature,
    } = req.query;

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    // Validate required fields
    if (
      !razorpay_payment_link_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        error: { message: "Missing payment verification parameters" },
      });
    }

    // Verify signature: payment_link_id|reference_id|status|payment_id
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expectedSignature = require("crypto")
      .createHmac("sha256", secret)
      .update(
        `${razorpay_payment_link_id}|${razorpay_payment_link_reference_id}|${razorpay_payment_link_status}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("Payment link signature verification failed");
      return res.status(400).json({
        error: { message: "Invalid payment signature" },
      });
    }

    // Check if payment status is paid
    if (razorpay_payment_link_status !== "paid") {
      return res.status(400).json({
        error: {
          message: `Payment not completed. Status: ${razorpay_payment_link_status}`,
        },
      });
    }

    // Get payment record by payment link ID (stored in razorpayOrderId field)
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_payment_link_id as string,
        userId,
        purpose: "EVENT_REGISTRATION",
      },
    });

    if (!paymentRecord) {
      return res.status(404).json({
        error: { message: "Payment record not found" },
      });
    }

    // Get event ID from metadata
    const metadata = paymentRecord.metadata as any;
    const eventId = metadata?.eventId;

    if (!eventId) {
      return res.status(400).json({
        error: { message: "Event ID not found in payment record" },
      });
    }

    // Execute all operations in a serializable transaction
    const registration = await prisma.$transaction(
      async (tx) => {
        // Get event details with registration count
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: {
            _count: {
              select: { registrations: { where: { status: "CONFIRMED" } } },
            },
          },
        });

        if (!event) {
          throw new Error("Event not found");
        }

        // Check if already registered (inside transaction for atomicity)
        const existingRegistration = await tx.eventRegistration.findUnique({
          where: {
            userId_eventId: { userId, eventId: event.id },
          },
        });

        if (existingRegistration) {
          if (existingRegistration.status === "CONFIRMED") {
            // Idempotent response - already registered
            return {
              alreadyRegistered: true,
              registration: existingRegistration,
              eventSlug: event.slug,
            };
          }
        }

        // Check max participants (atomic check inside transaction)
        if (event.maxParticipants !== null) {
          const confirmedCount = event._count.registrations;
          if (confirmedCount >= event.maxParticipants) {
            throw new Error("Event is full");
          }
        }

        // Create or update registration with CONFIRMED status
        const newRegistration = await tx.eventRegistration.upsert({
          where: {
            userId_eventId: { userId, eventId: event.id },
          },
          create: {
            userId,
            eventId: event.id,
            orderId: razorpay_payment_link_id as string,
            paymentId: razorpay_payment_id as string,
            paymentStatus: "COMPLETED",
            amountPaid: event.registrationFee,
            status: "CONFIRMED",
          },
          update: {
            orderId: razorpay_payment_link_id as string,
            paymentId: razorpay_payment_id as string,
            paymentStatus: "COMPLETED",
            status: "CONFIRMED",
          },
        });

        // Update payment log
        await tx.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: "COMPLETED",
            razorpayPaymentId: razorpay_payment_id as string,
            razorpaySignature: razorpay_signature as string,
            referenceId: newRegistration.id,
          },
        });

        // Create event account (if not exists)
        await tx.eventAccount.upsert({
          where: { registrationId: newRegistration.id },
          create: {
            registrationId: newRegistration.id,
            cash: event.initialBalance,
            usedMargin: toDecimal(0),
          },
          update: {}, // No update needed
        });

        return {
          alreadyRegistered: false,
          registration: newRegistration,
          eventSlug: event.slug,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000,
      }
    );

    return res.status(200).json({
      success: true,
      message: registration.alreadyRegistered
        ? "Already registered for this event"
        : "Payment verified successfully",
      registration: {
        id: registration.registration.id,
        status: "CONFIRMED",
        eventId: registration.registration.eventId,
      },
      eventSlug: registration.eventSlug,
    });
  } catch (error) {
    console.error("Error verifying event payment link:", error);
    return res.status(500).json({
      error: { message: getErrorMessage(error) || "Error verifying payment" },
    });
  }
};

/**
 * Get payment history
 * GET /payment/history
 */
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    const { page = "1", limit = "20", purpose, status } = req.query;

    const where: any = { userId };
    if (purpose && typeof purpose === "string") {
      where.purpose = purpose;
    }
    if (status && typeof status === "string") {
      where.status = status;
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          amount: true,
          depositedAmount: true,
          exchangeRate: true,
          currency: true,
          status: true,
          purpose: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.payment.count({ where }),
    ]);

    // Convert Decimal to number for response
    const formattedPayments = payments.map((p) => ({
      ...p,
      amount: fromDecimal(p.amount),
      depositedAmount: p.depositedAmount
        ? fromDecimal(p.depositedAmount)
        : null,
      exchangeRate: p.exchangeRate ? fromDecimal(p.exchangeRate) : null,
    }));

    return res.status(200).json({
      payments: formattedPayments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error retrieving payment history:", error);
    return res.status(500).json({
      error: { message: "Error retrieving payment history" },
    });
  }
};
