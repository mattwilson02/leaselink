/*
  Warnings:

  - The values [INVESTMENT_STATEMENTS,CORRESPONDENTS,TAX_DOCUMENTS] on the enum `DOCUMENT_FOLDER` will be removed. If these variants are still used in the database, this will fail.
  - The values [SUPPORT] on the enum `ROLE` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `receives_notifications_for_portfolio` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `linked_transaction_id` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `collection_ids` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `body` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PROPERTY_TYPE" AS ENUM ('APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO');

-- CreateEnum
CREATE TYPE "PROPERTY_STATUS" AS ENUM ('VACANT', 'LISTED', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "LEASE_STATUS" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "MAINTENANCE_PRIORITY" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "MAINTENANCE_STATUS" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MAINTENANCE_CATEGORY" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'OTHER');

-- CreateEnum
CREATE TYPE "PAYMENT_STATUS" AS ENUM ('UPCOMING', 'PENDING', 'PAID', 'OVERDUE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActionType" ADD VALUE 'SIGN_LEASE';
ALTER TYPE "ActionType" ADD VALUE 'MAINTENANCE_UPDATE';
ALTER TYPE "ActionType" ADD VALUE 'LEASE_EXPIRY';
ALTER TYPE "ActionType" ADD VALUE 'RENT_REMINDER';
ALTER TYPE "ActionType" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "ActionType" ADD VALUE 'PAYMENT_OVERDUE';
ALTER TYPE "ActionType" ADD VALUE 'INSPECTION_SCHEDULED';
ALTER TYPE "ActionType" ADD VALUE 'LEASE_RENEWAL';

-- AlterEnum
CREATE TYPE "DOCUMENT_FOLDER_new" AS ENUM ('IDENTIFICATION', 'LEASE_AGREEMENTS', 'SIGNED_DOCUMENTS', 'INSPECTION_REPORTS', 'INSURANCE', 'OTHER');
ALTER TABLE "documents" ALTER COLUMN "folder" TYPE "DOCUMENT_FOLDER_new" USING ("folder"::text::"DOCUMENT_FOLDER_new");
ALTER TYPE "DOCUMENT_FOLDER" RENAME TO "DOCUMENT_FOLDER_old";
ALTER TYPE "DOCUMENT_FOLDER_new" RENAME TO "DOCUMENT_FOLDER";
DROP TYPE "public"."DOCUMENT_FOLDER_old";

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "REQUEST_TYPE" ADD VALUE 'SIGNED_LEASE';
ALTER TYPE "REQUEST_TYPE" ADD VALUE 'MOVE_IN_CHECKLIST';

-- AlterEnum
CREATE TYPE "ROLE_new" AS ENUM ('ADMIN', 'AGENT');
ALTER TABLE "public"."employees" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "employees" ALTER COLUMN "role" TYPE "ROLE_new" USING ("role"::text::"ROLE_new");
ALTER TYPE "ROLE" RENAME TO "ROLE_old";
ALTER TYPE "ROLE_new" RENAME TO "ROLE";
DROP TYPE "public"."ROLE_old";
ALTER TABLE "employees" ALTER COLUMN "role" SET DEFAULT 'AGENT';

-- DropForeignKey
ALTER TABLE "collection_ids" DROP CONSTRAINT "collection_ids_client_id_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "receives_notifications_for_portfolio",
ADD COLUMN     "receives_notifications_for_maintenance" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "property_id" TEXT;

-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "role" SET DEFAULT 'AGENT';

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "linked_transaction_id",
DROP COLUMN "text",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "linked_maintenance_request_id" TEXT,
ADD COLUMN     "linked_payment_id" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- DropTable
DROP TABLE "collection_ids";

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "property_type" "PROPERTY_TYPE" NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DOUBLE PRECISION NOT NULL,
    "sqft" INTEGER,
    "rent_amount" DOUBLE PRECISION NOT NULL,
    "status" "PROPERTY_STATUS" NOT NULL DEFAULT 'VACANT',
    "description" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leases" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "monthly_rent" DOUBLE PRECISION NOT NULL,
    "security_deposit" DOUBLE PRECISION NOT NULL,
    "status" "LEASE_STATUS" NOT NULL DEFAULT 'PENDING',
    "renewed_from_lease_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_requests" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "MAINTENANCE_PRIORITY" NOT NULL DEFAULT 'MEDIUM',
    "status" "MAINTENANCE_STATUS" NOT NULL DEFAULT 'OPEN',
    "category" "MAINTENANCE_CATEGORY" NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "PAYMENT_STATUS" NOT NULL DEFAULT 'UPCOMING',
    "stripe_checkout_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_manager_id_idx" ON "properties"("manager_id");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "leases_property_id_idx" ON "leases"("property_id");

-- CreateIndex
CREATE INDEX "leases_tenant_id_idx" ON "leases"("tenant_id");

-- CreateIndex
CREATE INDEX "leases_status_idx" ON "leases"("status");

-- CreateIndex
CREATE INDEX "leases_renewed_from_lease_id_idx" ON "leases"("renewed_from_lease_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_property_id_idx" ON "maintenance_requests"("property_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_tenant_id_idx" ON "maintenance_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "maintenance_requests_status_idx" ON "maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "maintenance_requests_priority_idx" ON "maintenance_requests"("priority");

-- CreateIndex
CREATE INDEX "payments_lease_id_idx" ON "payments"("lease_id");

-- CreateIndex
CREATE INDEX "payments_tenant_id_idx" ON "payments"("tenant_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_due_date_idx" ON "payments"("due_date");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leases" ADD CONSTRAINT "leases_renewed_from_lease_id_fkey" FOREIGN KEY ("renewed_from_lease_id") REFERENCES "leases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "leases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
