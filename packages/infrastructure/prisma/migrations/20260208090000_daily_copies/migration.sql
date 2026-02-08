-- CreateEnum
CREATE TYPE "DailyCopyCategory" AS ENUM (
    'CLASSIC',
    'POETRY',
    'CELEBRITY',
    'PHILOSOPHY',
    'POSITIVE',
    'WARM',
    'AESTHETIC'
);

-- CreateTable
CREATE TABLE "daily_copies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "category" "DailyCopyCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_copies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_copies_tenant_id_user_id_day_key" ON "daily_copies"("tenant_id", "user_id", "day");

-- CreateIndex
CREATE INDEX "daily_copies_tenant_id_day_idx" ON "daily_copies"("tenant_id", "day");

-- CreateIndex
CREATE INDEX "daily_copies_tenant_id_day_category_idx" ON "daily_copies"("tenant_id", "day", "category");
