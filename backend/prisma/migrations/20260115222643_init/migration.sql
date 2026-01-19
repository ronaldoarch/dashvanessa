-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'AFFILIATE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('CPA', 'REVENUE_SHARE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AFFILIATE',
    "affiliateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliates" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "siteIds" INTEGER[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "externalId" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ftds" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ftds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "playerId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "CommissionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "ftdId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "CommissionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revshare_reports" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "campaignId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revshare_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_affiliateId_key" ON "users"("affiliateId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_externalId_key" ON "affiliates"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_userId_key" ON "affiliates"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "players_externalId_key" ON "players"("externalId");

-- CreateIndex
CREATE INDEX "ftds_affiliateId_idx" ON "ftds"("affiliateId");

-- CreateIndex
CREATE INDEX "ftds_date_idx" ON "ftds"("date");

-- CreateIndex
CREATE INDEX "transactions_affiliateId_idx" ON "transactions"("affiliateId");

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_ftdId_key" ON "commissions"("ftdId");

-- CreateIndex
CREATE INDEX "commissions_affiliateId_idx" ON "commissions"("affiliateId");

-- CreateIndex
CREATE INDEX "commissions_date_idx" ON "commissions"("date");

-- CreateIndex
CREATE INDEX "revshare_reports_affiliateId_idx" ON "revshare_reports"("affiliateId");

-- CreateIndex
CREATE INDEX "revshare_reports_date_idx" ON "revshare_reports"("date");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ftds" ADD CONSTRAINT "ftds_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ftds" ADD CONSTRAINT "ftds_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revshare_reports" ADD CONSTRAINT "revshare_reports_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
