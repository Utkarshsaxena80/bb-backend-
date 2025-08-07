-- AlterTable
ALTER TABLE "public"."DonationRequest" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preferredDate" TIMESTAMP(3),
ADD COLUMN     "requiredUnits" INTEGER DEFAULT 1,
ADD COLUMN     "urgencyLevel" TEXT DEFAULT 'medium';

-- CreateTable
CREATE TABLE "public"."blood_units" (
    "id" TEXT NOT NULL,
    "donationRequestId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "donorBloodType" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "bloodBankName" TEXT NOT NULL,
    "donationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "numberOfUnits" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "patientUsedFor" TEXT,
    "notes" TEXT,

    CONSTRAINT "blood_units_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."blood_units" ADD CONSTRAINT "blood_units_donationRequestId_fkey" FOREIGN KEY ("donationRequestId") REFERENCES "public"."DonationRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
