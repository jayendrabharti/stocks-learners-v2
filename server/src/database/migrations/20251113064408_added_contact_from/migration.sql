-- DropForeignKey
ALTER TABLE "contact_forms" DROP CONSTRAINT "contact_forms_email_fkey";

-- AddForeignKey
ALTER TABLE "contact_forms" ADD CONSTRAINT "contact_forms_email_fkey" FOREIGN KEY ("email") REFERENCES "users"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
