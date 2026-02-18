-- CreateEnum
CREATE TYPE "CommentSource" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "CommentThreadStatus" AS ENUM ('OPEN', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommentAuthorType" AS ENUM ('MEMBER', 'COLLABORATOR', 'REGISTERED_EXTERNAL', 'GUEST_EXTERNAL');

-- CreateEnum
CREATE TYPE "CommentModerationStatus" AS ENUM ('PASS', 'REVIEW', 'REJECT');

-- CreateTable
CREATE TABLE "comment_threads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "share_id" TEXT,
    "source" "CommentSource" NOT NULL,
    "status" "CommentThreadStatus" NOT NULL DEFAULT 'OPEN',
    "quote_text" TEXT,
    "anchor_type" TEXT,
    "anchor_payload" JSONB,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "participant_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_id" TEXT,
    "last_message_at" TIMESTAMP(3),
    "last_actor_type" "CommentAuthorType",
    "last_actor_user_id" TEXT,
    "last_actor_guest_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "reply_to_message_id" TEXT,
    "author_type" "CommentAuthorType" NOT NULL,
    "author_user_id" TEXT,
    "author_guest_id" TEXT,
    "content" JSONB NOT NULL,
    "content_text" TEXT NOT NULL,
    "moderation_status" "CommentModerationStatus" NOT NULL DEFAULT 'PASS',
    "risk_categories" JSONB,
    "risk_score" INTEGER,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_moderation_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "thread_id" TEXT,
    "message_id" TEXT,
    "actor_type" "CommentAuthorType",
    "actor_user_id" TEXT,
    "actor_guest_id" TEXT,
    "input_text_hash" TEXT NOT NULL,
    "result" "CommentModerationStatus" NOT NULL,
    "hit_categories" JSONB,
    "hit_terms" JSONB,
    "policy_version" TEXT,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comment_threads_tenant_page_status_last_idx" ON "comment_threads"("tenant_id", "page_id", "is_deleted", "status", "last_message_at", "id");

-- CreateIndex
CREATE INDEX "comment_threads_tenant_page_source_last_idx" ON "comment_threads"("tenant_id", "page_id", "source", "is_deleted", "last_message_at", "id");

-- CreateIndex
CREATE INDEX "comment_threads_tenant_share_last_idx" ON "comment_threads"("tenant_id", "share_id", "is_deleted", "last_message_at", "id");

-- CreateIndex
CREATE INDEX "comment_messages_tenant_thread_created_idx" ON "comment_messages"("tenant_id", "thread_id", "is_deleted", "created_at", "id");

-- CreateIndex
CREATE INDEX "comment_messages_tenant_thread_visible_created_idx" ON "comment_messages"("tenant_id", "thread_id", "is_visible", "created_at", "id");

-- CreateIndex
CREATE INDEX "comment_messages_tenant_moderation_created_idx" ON "comment_messages"("tenant_id", "moderation_status", "created_at");

-- CreateIndex
CREATE INDEX "comment_messages_tenant_author_user_created_idx" ON "comment_messages"("tenant_id", "author_user_id", "created_at");

-- CreateIndex
CREATE INDEX "comment_messages_tenant_author_guest_created_idx" ON "comment_messages"("tenant_id", "author_guest_id", "created_at");

-- CreateIndex
CREATE INDEX "comment_mod_logs_tenant_page_created_idx" ON "comment_moderation_logs"("tenant_id", "page_id", "created_at");

-- CreateIndex
CREATE INDEX "comment_mod_logs_tenant_result_created_idx" ON "comment_moderation_logs"("tenant_id", "result", "created_at");

-- CreateIndex
CREATE INDEX "comment_mod_logs_tenant_guest_created_idx" ON "comment_moderation_logs"("tenant_id", "actor_guest_id", "created_at");

-- AddForeignKey
ALTER TABLE "comment_messages" ADD CONSTRAINT "comment_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "comment_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
