CREATE TYPE "ShareType" AS ENUM ('PAGE', 'SPACE', 'AI_CONVERSATION', 'CUSTOM');

CREATE TYPE "ShareStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TYPE "ShareVisibility" AS ENUM ('PUBLIC', 'RESTRICTED');

CREATE TABLE "external_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "ShareType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "ShareVisibility" NOT NULL DEFAULT 'PUBLIC',
    "public_id" TEXT NOT NULL,
    "token_hash" TEXT,
    "expires_at" TIMESTAMP(3),
    "password_hash" TEXT,
    "extra_data" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "share_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "share_access_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extra_data" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "external_shares_public_id_key" ON "external_shares"("public_id");

CREATE UNIQUE INDEX "external_shares_token_hash_key" ON "external_shares"("token_hash");

CREATE INDEX "external_shares_tenant_id_idx" ON "external_shares"("tenant_id");

CREATE INDEX "external_shares_tenant_id_type_idx" ON "external_shares"("tenant_id", "type");

CREATE INDEX "external_shares_tenant_id_target_id_idx" ON "external_shares"("tenant_id", "target_id");

CREATE INDEX "share_snapshots_tenant_id_share_id_idx" ON "share_snapshots"("tenant_id", "share_id");

CREATE INDEX "share_access_logs_tenant_id_share_id_accessed_at_idx" ON "share_access_logs"("tenant_id", "share_id", "accessed_at");

ALTER TABLE "share_snapshots" ADD CONSTRAINT "share_snapshots_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "external_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "share_access_logs" ADD CONSTRAINT "share_access_logs_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "external_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ShareScopeType" AS ENUM ('TENANT', 'SPACE');

-- AlterTable
ALTER TABLE "external_shares" ADD COLUMN     "scope_id" TEXT,
ADD COLUMN     "scope_type" "ShareScopeType";

-- CreateIndex
CREATE INDEX "external_shares_tenant_id_scope_type_scope_id_idx" ON "external_shares"("tenant_id", "scope_type", "scope_id");
