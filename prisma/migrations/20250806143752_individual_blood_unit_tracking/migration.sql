/*
  Warnings:

  - You are about to drop the column `numberOfUnits` on the `blood_units` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[donationRequestId,unitNumber]` on the table `blood_units` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unitNumber` to the `blood_units` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."blood_units" DROP COLUMN "numberOfUnits",
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "unitNumber" TEXT NOT NULL,
ADD COLUMN     "volume" INTEGER NOT NULL DEFAULT 450;

-- CreateIndex
CREATE UNIQUE INDEX "blood_units_donationRequestId_unitNumber_key" ON "public"."blood_units"("donationRequestId", "unitNumber");
