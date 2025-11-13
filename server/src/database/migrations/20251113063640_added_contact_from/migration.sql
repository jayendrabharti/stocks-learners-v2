/*
  Warnings:

  - You are about to drop the column `userId` on the `contact_forms` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contact_forms" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "contact_forms" ADD CONSTRAINT "contact_forms_email_fkey" FOREIGN KEY ("email") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
