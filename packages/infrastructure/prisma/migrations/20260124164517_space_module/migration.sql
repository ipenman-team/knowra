-- CreateEnum
CREATE TYPE "SpaceType" AS ENUM ('PERSONAL', 'ORG');

-- CreateEnum
CREATE TYPE "SpaceMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- DropIndex
DROP INDEX "user_identities_identifier_trgm_idx";

-- DropIndex
DROP INDEX "user_profiles_nickname_pinyin_abbr_trgm_idx";

-- DropIndex
DROP INDEX "user_profiles_nickname_pinyin_trgm_idx";

-- DropIndex
DROP INDEX "user_profiles_nickname_trgm_idx";

-- CreateTable
CREATE TABLE "spaces" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "identifier" TEXT,
    "type" "SpaceType" NOT NULL DEFAULT 'ORG',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spaces_pkey" PRIMARY KEY ("id")
);

-- Seed default space for each tenant (use tenant_id as space id)
INSERT INTO "spaces" ("id", "tenant_id", "name", "type", "is_archived", "created_by", "updated_by", "is_deleted", "created_at", "updated_at")
SELECT
    t."id",
    t."id",
    '默认空间',
    CASE WHEN t."type" = 'PERSONAL' THEN 'PERSONAL'::"SpaceType" ELSE 'ORG'::"SpaceType" END,
    false,
    t."created_by",
    t."updated_by",
    false,
    NOW(),
    NOW()
FROM "tenants" t
WHERE NOT EXISTS (
    SELECT 1 FROM "spaces" s WHERE s."tenant_id" = t."id"
);

-- CreateTable
CREATE TABLE "space_members" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "SpaceMemberRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_favorites" (
    "id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spaces_tenant_id_idx" ON "spaces"("tenant_id");

-- CreateIndex
CREATE INDEX "spaces_tenant_id_identifier_idx" ON "spaces"("tenant_id", "identifier");

-- CreateIndex
CREATE INDEX "spaces_tenant_id_name_idx" ON "spaces"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "space_members_user_id_idx" ON "space_members"("user_id");

-- CreateIndex
CREATE INDEX "space_members_space_id_idx" ON "space_members"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_members_space_id_user_id_key" ON "space_members"("space_id", "user_id");

-- CreateIndex
CREATE INDEX "space_favorites_user_id_idx" ON "space_favorites"("user_id");

-- CreateIndex
CREATE INDEX "space_favorites_space_id_idx" ON "space_favorites"("space_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_favorites_space_id_user_id_key" ON "space_favorites"("space_id", "user_id");

-- AlterTable
ALTER TABLE "page_versions" ADD COLUMN "space_id" TEXT;

-- AlterTable
ALTER TABLE "pages" ADD COLUMN "space_id" TEXT;

-- Backfill space_id using tenant_id
UPDATE "page_versions"
SET "space_id" = "tenant_id"
WHERE "space_id" IS NULL;

UPDATE "pages"
SET "space_id" = "tenant_id"
WHERE "space_id" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "page_versions" ALTER COLUMN "space_id" SET NOT NULL;
ALTER TABLE "pages" ALTER COLUMN "space_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "page_versions_tenant_id_space_id_idx" ON "page_versions"("tenant_id", "space_id");

-- CreateIndex
CREATE INDEX "pages_tenant_id_space_id_idx" ON "pages"("tenant_id", "space_id");

-- AddForeignKey
ALTER TABLE "spaces" ADD CONSTRAINT "spaces_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_favorites" ADD CONSTRAINT "space_favorites_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_favorites" ADD CONSTRAINT "space_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
