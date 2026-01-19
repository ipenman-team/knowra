CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "PageVersionStatus" AS ENUM ('DRAFT', 'TEMP', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('IMPORT', 'EXPORT', 'RAG_INDEX');

-- CreateTable
CREATE TABLE "rag_chunks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "page_version_id" TEXT,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(2560) NOT NULL,
    "metadata" JSONB,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "parent_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "status" "PageVersionStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "parent_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "payload" JSONB,
    "result" JSONB,
    "error" TEXT,
    "cancel_requested_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rag_chunks_tenant_id_idx" ON "rag_chunks"("tenant_id");

-- CreateIndex
CREATE INDEX "rag_chunks_tenant_id_page_id_idx" ON "rag_chunks"("tenant_id", "page_id");

-- CreateIndex
CREATE INDEX "rag_chunks_tenant_id_page_version_id_idx" ON "rag_chunks"("tenant_id", "page_version_id");

-- CreateIndex
CREATE INDEX "pages_id_idx" ON "pages"("id");

-- CreateIndex
CREATE INDEX "pages_tenant_id_idx" ON "pages"("tenant_id");

-- CreateIndex
CREATE INDEX "page_versions_id_idx" ON "page_versions"("id");

-- CreateIndex
CREATE INDEX "page_versions_tenant_id_idx" ON "page_versions"("tenant_id");

-- CreateIndex
CREATE INDEX "page_versions_page_id_idx" ON "page_versions"("page_id");

-- CreateIndex
CREATE INDEX "page_versions_page_id_created_at_idx" ON "page_versions"("page_id", "created_at");

-- CreateIndex
CREATE INDEX "page_versions_page_id_status_idx" ON "page_versions"("page_id", "status");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_idx" ON "tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_type_idx" ON "tasks"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "tasks_tenant_id_status_idx" ON "tasks"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "page_versions" ADD CONSTRAINT "page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
