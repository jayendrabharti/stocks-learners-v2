import prisma from "@/database/client";
import { getErrorMessage } from "@/utils";
import { Request, Response } from "express";
import Razorpay from "razorpay";
import { verifyPaymentSchema } from "@/utils/validation.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export const CreateOrder = async (req: Request, res: Response) => {
  try {
    const { amount } = req.query as { amount: string | number | undefined };

    if (!amount) {
      throw new Error("Amount is required to create an order");
    }

    const order = await razorpay.orders.create({
      amount: Number(amount) * 100, // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        purpose: "Registration Payment",
        userId: req.user?.id || "guest",
      },
    });
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: getErrorMessage(error) || "Failed to create order",
      },
    });
  }
};

export const VerifyOrder = async (req: Request, res: Response) => {
  try {
    const { amount, payment_id } = req.query as {
      amount: string | number | undefined;
      order_id: string | undefined;
      payment_id: string | undefined;
    };

    if (!amount || !payment_id) {
      throw new Error("Amount is required to create an order");
    }

    const capturePayment = await razorpay.payments.fetch(payment_id);

    if (
      capturePayment.amount !== Number(amount) * 100 ||
      capturePayment.status !== "captured"
    ) {
      throw new Error("Payment Verification failed");
    }

    if (req.user?.id) await DepositFunds(req.user.id, Number(amount));

    return res.status(200).json({
      success: true,
      message: "Payment successful and funds deposited",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: getErrorMessage(error) || "Failed to verify payment",
      },
    });
  }
};

const DepositFunds = async (userId: string, amount: number) => {
  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found. Please log in again.");
  }

  // Use upsert to atomically create or update account (prevents race condition)
  await prisma.account.upsert({
    where: { userId },
    create: {
      userId,
      cash: amount,
      usedMargin: 0,
    },
    update: {
      cash: { increment: amount },
    },
  });
};

/**
 * Verify event payment
 * POST /payment/event/verify
 */
export const verifyEventPayment = async (req: Request, res: Response) => {
  try {
    // Validate input
    const validated = verifyPaymentSchema.parse(req.body);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validated;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: "Authentication required" },
      });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: { message: "Missing payment verification details" },
      });
    }

    // Verify signature
    const crypto = await import("crypto");
    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(generatedSignature);
    const receivedSignatureBuffer = Buffer.from(razorpay_signature);
    
    if (
      signatureBuffer.length !== receivedSignatureBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, receivedSignatureBuffer)
    ) {
      return res.status(400).json({
        error: { message: "Invalid payment signature" },
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

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        error: { message: "Event not found" },
      });
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        userId,
        eventId: event.id,
      },
    });

    if (existingRegistration) {
      return res.status(400).json({
        error: { message: "Already registered for this event" },
      });
    }

    // Create registration and event account in transaction
    const registration = await prisma.$transaction(async (tx) => {
      // Create event registration with CONFIRMED status
      const newRegistration = await tx.eventRegistration.create({
        data: {
          userId,
          eventId: event.id,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          paymentStatus: "COMPLETED",
          amountPaid: event.registrationFee,
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

      // Create event account
      await tx.eventAccount.create({
        data: {
          registrationId: newRegistration.id,
          cash: event.initialBalance,
          usedMargin: 0,
        },
      });

      return newRegistration;
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      registration: {
        id: registration.id,
        status: "CONFIRMED",
        eventId: registration.eventId,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({
      error: { message: "Error verifying payment" },
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

    const { page = "1", limit = "20", purpose } = req.query;

    const where: any = { userId };
    if (purpose && typeof purpose === "string") {
      where.purpose = purpose;
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
      }),
      prisma.payment.count({ where }),
    ]);

    return res.status(200).json({
      payments,
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
