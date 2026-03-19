-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ACTION');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SIGN_DOCUMENT', 'UPLOAD_DOCUMENT', 'BASIC_COMPLETE');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "action_type" "ActionType",
    "linked_document_id" TEXT,
    "linked_transaction_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_action_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
