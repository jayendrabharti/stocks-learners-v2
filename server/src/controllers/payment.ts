import prisma from "@/database/client";
import { getErrorMessage } from "@/utils";
import { Request, Response } from "express";
import Razorpay from "razorpay";

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
  let account = await prisma.account.findUnique({
    where: { userId },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId,
        cash: amount,
        usedMargin: 0,
      },
    });
  } else {
    account = await prisma.account.update({
      where: { userId },
      data: {
        cash: account.cash + amount,
      },
    });
  }
};
