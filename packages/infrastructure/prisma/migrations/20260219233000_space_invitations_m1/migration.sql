-- CreateEnum
CREATE TYPE "SpaceInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SpaceInvitationChannel" AS ENUM ('EMAIL', 'LINK');

-- CreateTable
CREATE TABLE "space_invitations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "inviter_user_id" TEXT NOT NULL,
    "invitee_email" TEXT,
    "invitee_user_id" TEXT,
    "role" "SpaceMemberRole" NOT NULL DEFAULT 'MEMBER',
    "channel" "SpaceInvitationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "SpaceInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by" TEXT,
    "sent_at" TIMESTAMP(3),
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "space_invitations_token_hash_key" ON "space_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "space_invite_tenant_space_status_exp_idx" ON "space_invitations"("tenant_id", "space_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "space_invite_tenant_email_status_idx" ON "space_invitations"("tenant_id", "invitee_email", "status");

-- AddForeignKey
ALTER TABLE "space_invitations" ADD CONSTRAINT "space_invitations_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
