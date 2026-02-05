-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subject_type" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trace_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "act_tenant_del_created_idx" ON "activities"("tenant_id", "is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "act_tenant_actor_del_created_idx" ON "activities"("tenant_id", "actor_user_id", "is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "act_tenant_subject_del_created_idx" ON "activities"("tenant_id", "subject_type", "subject_id", "is_deleted", "created_at");

-- CreateIndex
CREATE INDEX "act_tenant_action_del_created_idx" ON "activities"("tenant_id", "action", "is_deleted", "created_at");