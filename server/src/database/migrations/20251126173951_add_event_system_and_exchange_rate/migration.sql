/*
  Warnings:

  - A unique constraint covering the columns `[userId,instrumentId,product]` on the table `Position` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AutoSquareOffStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "autoSquareOffAt" TIMESTAMP(3),
ADD COLUMN     "autoSquareOffStatus" "AutoSquareOffStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "lastSquareOffError" TEXT,
ADD COLUMN     "squareOffAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "registrationStartAt" TIMESTAMP(3) NOT NULL,
    "registrationEndAt" TIMESTAMP(3) NOT NULL,
    "eventStartAt" TIMESTAMP(3) NOT NULL,
    "eventEndAt" TIMESTAMP(3) NOT NULL,
    "registrationFee" DOUBLE PRECISION NOT NULL,
    "initialBalance" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxParticipants" INTEGER,
    "bannerImage" TEXT,
    "rules" TEXT,
    "prizes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentId" TEXT,
    "orderId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_accounts" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "cash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedMargin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_positions" (
    "id" TEXT NOT NULL,
    "eventAccountId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "avgPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realizedPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "product" "TradeType" NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "autoSquareOffAt" TIMESTAMP(3),
    "autoSquareOffStatus" "AutoSquareOffStatus" NOT NULL DEFAULT 'PENDING',
    "squareOffAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastSquareOffError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_transactions" (
    "id" TEXT NOT NULL,
    "eventAccountId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,
    "product" "TradeType" NOT NULL,
    "qty" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "limitPrice" DOUBLE PRECISION,
    "realizedPnl" DOUBLE PRECISION,
    "positionId" TEXT,
    "fees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_position_lots" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "buyTransactionId" TEXT NOT NULL,
    "totalQty" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL DEFAULT 0,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_position_lots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayOrderId_key" ON "payments"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_razorpayPaymentId_key" ON "payments"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_purpose_idx" ON "payments"("purpose");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_eventStartAt_eventEndAt_idx" ON "events"("eventStartAt", "eventEndAt");

-- CreateIndex
CREATE INDEX "events_isActive_idx" ON "events"("isActive");

-- CreateIndex
CREATE INDEX "events_slug_idx" ON "events"("slug");

-- CreateIndex
CREATE INDEX "event_registrations_eventId_status_idx" ON "event_registrations"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_registrations_paymentStatus_idx" ON "event_registrations"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_userId_eventId_key" ON "event_registrations"("userId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_accounts_registrationId_key" ON "event_accounts"("registrationId");

-- CreateIndex
CREATE INDEX "event_positions_eventAccountId_product_idx" ON "event_positions"("eventAccountId", "product");

-- CreateIndex
CREATE INDEX "event_positions_eventAccountId_isOpen_idx" ON "event_positions"("eventAccountId", "isOpen");

-- CreateIndex
CREATE INDEX "event_positions_autoSquareOffAt_autoSquareOffStatus_idx" ON "event_positions"("autoSquareOffAt", "autoSquareOffStatus");

-- CreateIndex
CREATE UNIQUE INDEX "event_positions_eventAccountId_instrumentId_product_key" ON "event_positions"("eventAccountId", "instrumentId", "product");

-- CreateIndex
CREATE INDEX "event_transactions_eventAccountId_idx" ON "event_transactions"("eventAccountId");

-- CreateIndex
CREATE INDEX "event_transactions_createdAt_idx" ON "event_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "event_position_lots_positionId_idx" ON "event_position_lots"("positionId");

-- CreateIndex
CREATE INDEX "Position_userId_product_idx" ON "Position"("userId", "product");

-- CreateIndex
CREATE INDEX "Position_userId_isOpen_idx" ON "Position"("userId", "isOpen");

-- CreateIndex
CREATE INDEX "Position_autoSquareOffAt_autoSquareOffStatus_idx" ON "Position"("autoSquareOffAt", "autoSquareOffStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_instrumentId_product_key" ON "Position"("userId", "instrumentId", "product");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_accounts" ADD CONSTRAINT "event_accounts_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_positions" ADD CONSTRAINT "event_positions_eventAccountId_fkey" FOREIGN KEY ("eventAccountId") REFERENCES "event_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_positions" ADD CONSTRAINT "event_positions_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_transactions" ADD CONSTRAINT "event_transactions_eventAccountId_fkey" FOREIGN KEY ("eventAccountId") REFERENCES "event_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_transactions" ADD CONSTRAINT "event_transactions_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_transactions" ADD CONSTRAINT "event_transactions_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "event_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_position_lots" ADD CONSTRAINT "event_position_lots_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "event_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_position_lots" ADD CONSTRAINT "event_position_lots_buyTransactionId_fkey" FOREIGN KEY ("buyTransactionId") REFERENCES "event_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
