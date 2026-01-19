-- AlterTable
ALTER TABLE "affiliates" ADD COLUMN     "referredById" TEXT;

-- CreateIndex
CREATE INDEX "affiliates_referredById_idx" ON "affiliates"("referredById");

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
