-- AlterTable
ALTER TABLE "leases" ADD COLUMN     "early_termination_fee" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "failed_webhooks" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_webhooks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_signed_by_fkey" FOREIGN KEY ("signed_by") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
