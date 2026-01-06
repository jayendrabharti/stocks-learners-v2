/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from "zod";

// Trading validation
export const buyOrderSchema = z.object({
  instrumentId: z.string().min(1, "Instrument ID is required"),
  qty: z
    .number()
    .int()
    .positive()
    .max(10000, "Quantity must be between 1 and 10000"),
  product: z.enum(["CNC", "MIS"]),
  limitPrice: z.number().positive().optional(),
});

export const sellOrderSchema = z.object({
  instrumentId: z.string().min(1, "Instrument ID is required"),
  qty: z
    .number()
    .int()
    .positive()
    .max(10000, "Quantity must be between 1 and 10000"),
  product: z.enum(["CNC", "MIS"]),
  limitPrice: z.number().positive().optional(),
});

// Event validation
export const createEventSchema = z
  .object({
    title: z.string().min(3).max(100),
    description: z.string().optional(),
    slug: z
      .string()
      .min(3)
      .max(100)
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must be lowercase alphanumeric with hyphens"
      ),
    registrationStartAt: z.string().datetime(),
    registrationEndAt: z.string().datetime(),
    eventStartAt: z.string().datetime(),
    eventEndAt: z.string().datetime(),
    registrationFee: z.number().min(0),
    initialBalance: z.number().positive(),
    maxParticipants: z.number().int().positive().optional(),
    bannerImage: z.string().url().optional(),
    rules: z.string().optional(),
    prizes: z.any().optional(),
  })
  .refine(
    (data) =>
      new Date(data.registrationStartAt) < new Date(data.registrationEndAt),
    {
      message: "Registration start must be before registration end",
      path: ["registrationEndAt"],
    }
  )
  .refine(
    (data) => new Date(data.registrationEndAt) < new Date(data.eventStartAt),
    {
      message: "Registration must end before event starts",
      path: ["eventStartAt"],
    }
  )
  .refine((data) => new Date(data.eventStartAt) < new Date(data.eventEndAt), {
    message: "Event start must be before event end",
    path: ["eventEndAt"],
  });

export const updateEventSchema = createEventSchema.partial();

// Payment validation
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Deposit verification validation (includes amount for verification)
export const verifyDepositSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  amount: z.number().positive("Amount must be positive").optional(), // Optional - fetched from Razorpay if not provided
});

// Create order validation
export const createOrderSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(10, "Minimum amount is ₹10")
    .max(100000, "Maximum amount is ₹100,000"),
  idempotencyKey: z.string().optional(),
});

// Exchange rate validation
export const updateExchangeRateSchema = z.object({
  exchangeRate: z.number().positive().min(0.1).max(1000),
});

export type BuyOrderInput = z.infer<typeof buyOrderSchema>;
export type SellOrderInput = z.infer<typeof sellOrderSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type VerifyDepositInput = z.infer<typeof verifyDepositSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateExchangeRateInput = z.infer<typeof updateExchangeRateSchema>;
