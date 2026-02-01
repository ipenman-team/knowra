-- Add latest published version pointer to pages
ALTER TABLE "pages" ADD COLUMN "latest_published_version_id" TEXT;

-- Backfill from latest published versions (best-effort)
UPDATE "pages" p
SET "latest_published_version_id" = v."id"
FROM (
  SELECT DISTINCT ON ("page_id") "id", "page_id"
  FROM "page_versions"
  WHERE "status" = 'PUBLISHED' AND "is_deleted" = false
  ORDER BY "page_id", "created_at" DESC
) v
WHERE p."id" = v."page_id";

-- Foreign key with ON DELETE SET NULL to avoid dangling pointers
ALTER TABLE "pages"
  ADD CONSTRAINT "pages_latest_published_version_id_fkey"
  FOREIGN KEY ("latest_published_version_id")
  REFERENCES "page_versions"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;