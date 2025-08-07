/*
  Warnings:

  - Added the required column `donorBloodType` to the `DonationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DonationRequest" ADD COLUMN     "donorBloodType" TEXT NOT NULL;
