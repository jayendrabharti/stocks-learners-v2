/*
  Warnings:

  - The values [option,stock,index,future] on the enum `InstrumentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InstrumentType_new" AS ENUM ('EQ', 'IDX', 'FUT', 'CE', 'PE');
ALTER TABLE "watchlists" ALTER COLUMN "instrumentType" TYPE "InstrumentType_new" USING ("instrumentType"::text::"InstrumentType_new");
ALTER TYPE "InstrumentType" RENAME TO "InstrumentType_old";
ALTER TYPE "InstrumentType_new" RENAME TO "InstrumentType";
DROP TYPE "public"."InstrumentType_old";
COMMIT;
