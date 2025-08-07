-- CreateTable
CREATE TABLE "public"."DonationRequest" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donor" TEXT NOT NULL,
    "bloodBankId" TEXT NOT NULL,
    "bloodBank" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "DonationRequest_pkey" PRIMARY KEY ("id")
);
