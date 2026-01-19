-- AlterTable
ALTER TABLE "affiliates" ADD COLUMN     "dealId" TEXT;

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpaValue" DECIMAL(10,2) NOT NULL,
    "revSharePercentage" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
