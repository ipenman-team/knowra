-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "extra_data" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_tenant_id_user_id_target_type_target_id_key" ON "favorites"("tenant_id", "user_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX "favorites_tenant_user_deleted_idx" ON "favorites"("tenant_id", "user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "favorites_tenant_target_deleted_idx" ON "favorites"("tenant_id", "target_type", "target_id", "is_deleted");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- Migrate existing space favorites
INSERT INTO "favorites" (
    "id",
    "tenant_id",
    "user_id",
    "target_type",
    "target_id",
    "created_by",
    "updated_by",
    "is_deleted",
    "created_at",
    "updated_at"
)
SELECT
    sf."id",
    s."tenant_id",
    sf."user_id",
    'SPACE',
    sf."space_id",
    sf."created_by",
    sf."updated_by",
    sf."is_deleted",
    sf."created_at",
    sf."updated_at"
FROM "space_favorites" sf
JOIN "spaces" s ON s."id" = sf."space_id"
ON CONFLICT ("tenant_id", "user_id", "target_type", "target_id") DO UPDATE
SET
    "is_deleted" = EXCLUDED."is_deleted",
    "updated_by" = EXCLUDED."updated_by",
    "updated_at" = EXCLUDED."updated_at";

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable
DROP TABLE "space_favorites";
