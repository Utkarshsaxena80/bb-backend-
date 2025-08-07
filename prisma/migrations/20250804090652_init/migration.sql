/*
  Warnings:

  - Added the required column `state` to the `Patients` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Patients" ADD COLUMN     "state" TEXT NOT NULL;
