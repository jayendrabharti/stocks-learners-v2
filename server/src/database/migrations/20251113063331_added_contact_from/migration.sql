-- CreateEnum
CREATE TYPE "ContactFormStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "contact_forms" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "status" "ContactFormStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_forms_status_idx" ON "contact_forms"("status");

-- CreateIndex
CREATE INDEX "contact_forms_createdAt_idx" ON "contact_forms"("createdAt");
