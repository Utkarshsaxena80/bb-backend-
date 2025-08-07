/*
  Warnings:

  - Added the required column `patientBloodBankId` to the `DonationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientBloodBankName` to the `DonationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientCity` to the `DonationRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `DonationRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."DonationRequest" ADD COLUMN     "patientBloodBankId" TEXT NOT NULL,
ADD COLUMN     "patientBloodBankName" TEXT NOT NULL,
ADD COLUMN     "patientCity" TEXT NOT NULL,
ADD COLUMN     "patientId" TEXT NOT NULL;
