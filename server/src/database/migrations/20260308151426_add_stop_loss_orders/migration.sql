-- CreateEnum
CREATE TYPE "StopLossStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "stop_loss_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "triggerPrice" DECIMAL(20,4) NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "status" "StopLossStatus" NOT NULL DEFAULT 'ACTIVE',
    "transactionId" TEXT,
    "executedPrice" DECIMAL(20,4),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "triggeredAt" TIMESTAMP(3),

    CONSTRAINT "stop_loss_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stop_loss_orders_status_idx" ON "stop_loss_orders"("status");

-- CreateIndex
CREATE INDEX "stop_loss_orders_userId_status_idx" ON "stop_loss_orders"("userId", "status");

-- AddForeignKey
ALTER TABLE "stop_loss_orders" ADD CONSTRAINT "stop_loss_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stop_loss_orders" ADD CONSTRAINT "stop_loss_orders_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;
