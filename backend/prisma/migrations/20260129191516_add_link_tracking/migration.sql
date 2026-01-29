-- CreateEnum
CREATE TYPE "LinkEventType" AS ENUM ('CLICK', 'VIEW', 'CONVERSION');

-- CreateTable
CREATE TABLE "link_events" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT,
    "linkType" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "eventType" "LinkEventType" NOT NULL DEFAULT 'CLICK',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "link_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "link_events_affiliateId_idx" ON "link_events"("affiliateId");

-- CreateIndex
CREATE INDEX "link_events_linkType_idx" ON "link_events"("linkType");

-- CreateIndex
CREATE INDEX "link_events_eventType_idx" ON "link_events"("eventType");

-- CreateIndex
CREATE INDEX "link_events_createdAt_idx" ON "link_events"("createdAt");

-- AddForeignKey
ALTER TABLE "link_events" ADD CONSTRAINT "link_events_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
