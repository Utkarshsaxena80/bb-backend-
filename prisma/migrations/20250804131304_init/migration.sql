/*
  Warnings:

  - Added the required column `licenseNumber` to the `bloodBanks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."bloodBanks" ADD COLUMN     "licenseNumber" TEXT NOT NULL;
