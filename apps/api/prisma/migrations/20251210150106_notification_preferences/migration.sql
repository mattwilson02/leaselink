-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "receives_email_notifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receives_notifications_for_documents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receives_notifications_for_portfolio" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receives_push_notifications" BOOLEAN NOT NULL DEFAULT false;
