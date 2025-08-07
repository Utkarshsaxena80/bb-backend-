-- AlterTable
ALTER TABLE "public"."Patients" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."donors" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;
