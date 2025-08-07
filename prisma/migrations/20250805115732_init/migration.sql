/*
  Warnings:

  - Added the required column `patientBloodType` to the `DonationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DonationRequest" ADD COLUMN     "patientBloodType" TEXT NOT NULL;
