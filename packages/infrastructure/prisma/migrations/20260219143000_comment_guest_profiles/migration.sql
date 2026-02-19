-- AlterTable
ALTER TABLE "comment_messages"
ADD COLUMN "author_guest_nickname" TEXT;

-- CreateTable
CREATE TABLE "comment_guest_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "share_id" TEXT NOT NULL,
    "guest_id" TEXT NOT NULL,
    "nickname" VARCHAR(80) NOT NULL,
    "email" VARCHAR(320),
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_guest_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comment_guest_profiles_tenant_share_guest_key" ON "comment_guest_profiles"("tenant_id", "share_id", "guest_id");

-- CreateIndex
CREATE INDEX "comment_guest_profiles_tenant_share_last_seen_idx" ON "comment_guest_profiles"("tenant_id", "share_id", "last_seen_at");

-- CreateIndex
CREATE INDEX "comment_guest_profiles_tenant_share_email_idx" ON "comment_guest_profiles"("tenant_id", "share_id", "email");

-- AddForeignKey
ALTER TABLE "comment_guest_profiles"
ADD CONSTRAINT "comment_guest_profiles_share_id_fkey"
FOREIGN KEY ("share_id") REFERENCES "external_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;
