/*
  Warnings:

  - You are about to alter the column `cash` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `usedMargin` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `avgPrice` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `realizedPnl` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `buyPrice` on the `PositionLot` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `price` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `limitPrice` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `realizedPnl` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `fees` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `exchangeRate` on the `app_settings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `cash` on the `event_accounts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `usedMargin` on the `event_accounts` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `buyPrice` on the `event_position_lots` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `avgPrice` on the `event_positions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `realizedPnl` on the `event_positions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `amountPaid` on the `event_registrations` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `price` on the `event_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `limitPrice` on the `event_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `realizedPnl` on the `event_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `fees` on the `event_transactions` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `registrationFee` on the `events` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `initialBalance` on the `events` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,4)`.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "cash" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "usedMargin" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "avgPrice" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "realizedPnl" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "PositionLot" ALTER COLUMN "buyPrice" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "price" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "limitPrice" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "realizedPnl" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "fees" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "app_settings" ALTER COLUMN "exchangeRate" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "event_accounts" ALTER COLUMN "cash" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "usedMargin" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "event_position_lots" ALTER COLUMN "buyPrice" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "event_positions" ALTER COLUMN "avgPrice" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "realizedPnl" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "event_registrations" ALTER COLUMN "amountPaid" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "event_transactions" ALTER COLUMN "price" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "limitPrice" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "realizedPnl" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "fees" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "events" ALTER COLUMN "registrationFee" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "initialBalance" SET DATA TYPE DECIMAL(20,4);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "depositedAmount" DECIMAL(20,4),
ADD COLUMN     "exchangeRate" DECIMAL(10,4),
ADD COLUMN     "idempotencyKey" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,4);

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_razorpayPaymentId_status_idx" ON "payments"("razorpayPaymentId", "status");
