-- CreateEnum
CREATE TYPE "AffiliateInviteStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "affiliates" ADD COLUMN     "superbetAffiliateId" TEXT,
ADD COLUMN     "superbetAffiliateLink" TEXT;

-- CreateTable
CREATE TABLE "affiliate_invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AffiliateInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "affiliateId" TEXT,
    "superbetRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_invites_code_key" ON "affiliate_invites"("code");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_invites_affiliateId_key" ON "affiliate_invites"("affiliateId");

-- CreateIndex
CREATE INDEX "affiliate_invites_code_idx" ON "affiliate_invites"("code");

-- CreateIndex
CREATE INDEX "affiliate_invites_status_idx" ON "affiliate_invites"("status");

-- CreateIndex
CREATE INDEX "affiliate_invites_email_idx" ON "affiliate_invites"("email");

-- AddForeignKey
ALTER TABLE "affiliate_invites" ADD CONSTRAINT "affiliate_invites_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
