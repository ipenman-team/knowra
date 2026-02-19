-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'MENTION', 'COMMENT_REPLY', 'TASK_DONE', 'AI_DONE', 'CUSTOM');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "metadata" JSONB,
    "request_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notif_tenant_receiver_read_del_created_id_idx" ON "notifications"("tenant_id", "receiver_id", "is_read", "is_deleted", "created_at", "id");

-- CreateIndex
CREATE INDEX "notif_tenant_receiver_del_created_id_idx" ON "notifications"("tenant_id", "receiver_id", "is_deleted", "created_at", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notif_tenant_receiver_request_uidx" ON "notifications"("tenant_id", "receiver_id", "request_id");
