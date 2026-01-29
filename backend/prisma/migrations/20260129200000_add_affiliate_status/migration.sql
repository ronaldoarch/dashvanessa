-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "affiliates" ADD COLUMN     "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING';
