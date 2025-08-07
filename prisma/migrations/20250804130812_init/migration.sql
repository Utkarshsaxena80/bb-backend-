-- CreateTable
CREATE TABLE "public"."bloodBanks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "totalBloodBags" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloodBanks_pkey" PRIMARY KEY ("id")
);
