-- CreateEnum
CREATE TYPE "SpaceRoleBuiltInType" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateTable
CREATE TABLE "space_roles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "built_in_type" "SpaceRoleBuiltInType",
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_roles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "space_members" ADD COLUMN "space_role_id" TEXT;

-- AlterTable
ALTER TABLE "space_invitations" ADD COLUMN "space_role_id" TEXT;

-- CreateIndex
CREATE INDEX "space_roles_tenant_id_idx" ON "space_roles"("tenant_id");

-- CreateIndex
CREATE INDEX "space_roles_space_id_idx" ON "space_roles"("space_id");

-- CreateIndex
CREATE INDEX "space_roles_space_builtin_type_idx" ON "space_roles"("space_id", "is_built_in", "built_in_type");

-- CreateIndex
CREATE INDEX "space_members_space_role_id_idx" ON "space_members"("space_role_id");

-- Backfill built-in roles for each space
INSERT INTO "space_roles" (
  "id",
  "tenant_id",
  "space_id",
  "name",
  "description",
  "is_built_in",
  "built_in_type",
  "permissions",
  "created_by",
  "updated_by",
  "is_deleted",
  "created_at",
  "updated_at"
)
SELECT
  s."id" || '_role_owner',
  s."tenant_id",
  s."id",
  '所有者',
  '内置角色：所有者',
  true,
  'OWNER'::"SpaceRoleBuiltInType",
  jsonb_build_array(
    'space.view', 'space.edit', 'space.delete', 'space.archive',
    'space.member.view', 'space.member.invite', 'space.member.remove', 'space.member.role_change',
    'space.role.manage', 'space.share.manage',
    'page.create', 'page.view', 'page.edit', 'page.publish', 'page.delete', 'page.restore',
    'page.purge', 'page.export', 'page.share.manage', 'page.import',
    'comment.create', 'comment.delete_own', 'comment.delete_any', 'page.like',
    'rag.index.manage'
  ),
  COALESCE(s."created_by", 'system'),
  COALESCE(s."updated_by", s."created_by", 'system'),
  false,
  s."created_at",
  s."updated_at"
FROM "spaces" s
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "space_roles" (
  "id",
  "tenant_id",
  "space_id",
  "name",
  "description",
  "is_built_in",
  "built_in_type",
  "permissions",
  "created_by",
  "updated_by",
  "is_deleted",
  "created_at",
  "updated_at"
)
SELECT
  s."id" || '_role_admin',
  s."tenant_id",
  s."id",
  '管理员',
  '内置角色：管理员',
  true,
  'ADMIN'::"SpaceRoleBuiltInType",
  jsonb_build_array(
    'space.view', 'space.edit', 'space.archive',
    'space.member.view', 'space.member.invite', 'space.member.remove', 'space.member.role_change',
    'space.role.manage', 'space.share.manage',
    'page.create', 'page.view', 'page.edit', 'page.publish', 'page.delete', 'page.restore',
    'page.purge', 'page.export', 'page.share.manage', 'page.import',
    'comment.create', 'comment.delete_own', 'comment.delete_any', 'page.like',
    'rag.index.manage'
  ),
  COALESCE(s."created_by", 'system'),
  COALESCE(s."updated_by", s."created_by", 'system'),
  false,
  s."created_at",
  s."updated_at"
FROM "spaces" s
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "space_roles" (
  "id",
  "tenant_id",
  "space_id",
  "name",
  "description",
  "is_built_in",
  "built_in_type",
  "permissions",
  "created_by",
  "updated_by",
  "is_deleted",
  "created_at",
  "updated_at"
)
SELECT
  s."id" || '_role_member',
  s."tenant_id",
  s."id",
  '成员',
  '内置角色：成员',
  true,
  'MEMBER'::"SpaceRoleBuiltInType",
  jsonb_build_array(
    'space.view', 'space.member.view',
    'page.create', 'page.view', 'page.edit', 'page.publish', 'page.delete', 'page.restore',
    'page.export', 'page.import', 'page.share.manage',
    'comment.create', 'comment.delete_own', 'page.like'
  ),
  COALESCE(s."created_by", 'system'),
  COALESCE(s."updated_by", s."created_by", 'system'),
  false,
  s."created_at",
  s."updated_at"
FROM "spaces" s
ON CONFLICT ("id") DO NOTHING;

-- Backfill member role reference
UPDATE "space_members" m
SET "space_role_id" = CASE m."role"
  WHEN 'OWNER' THEN m."space_id" || '_role_owner'
  WHEN 'ADMIN' THEN m."space_id" || '_role_admin'
  ELSE m."space_id" || '_role_member'
END
WHERE m."space_role_id" IS NULL;

-- Backfill invitation role reference
UPDATE "space_invitations" i
SET "space_role_id" = CASE i."role"
  WHEN 'OWNER' THEN i."space_id" || '_role_owner'
  WHEN 'ADMIN' THEN i."space_id" || '_role_admin'
  ELSE i."space_id" || '_role_member'
END
WHERE i."space_role_id" IS NULL;

-- CreateIndex
CREATE INDEX "space_invitations_space_role_id_idx" ON "space_invitations"("space_role_id");

-- AddForeignKey
ALTER TABLE "space_roles" ADD CONSTRAINT "space_roles_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_space_role_id_fkey" FOREIGN KEY ("space_role_id") REFERENCES "space_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_invitations" ADD CONSTRAINT "space_invitations_space_role_id_fkey" FOREIGN KEY ("space_role_id") REFERENCES "space_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
