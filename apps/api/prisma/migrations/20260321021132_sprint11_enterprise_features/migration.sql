-- CreateEnum
CREATE TYPE "EXPENSE_CATEGORY" AS ENUM ('MAINTENANCE', 'INSURANCE', 'TAX', 'UTILITY', 'MANAGEMENT_FEE', 'REPAIR', 'IMPROVEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "AUDIT_ACTION" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'UPLOAD', 'DOWNLOAD', 'SIGN');

-- CreateEnum
CREATE TYPE "AUDIT_RESOURCE_TYPE" AS ENUM ('PROPERTY', 'LEASE', 'TENANT', 'PAYMENT', 'MAINTENANCE_REQUEST', 'DOCUMENT', 'EXPENSE', 'VENDOR');

-- AlterTable
ALTER TABLE "maintenance_requests" ADD COLUMN     "vendor_id" TEXT;

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" "MAINTENANCE_CATEGORY" NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "maintenance_request_id" TEXT,
    "category" "EXPENSE_CATEGORY" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "receipt_blob_key" TEXT,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "action" "AUDIT_ACTION" NOT NULL,
    "resource_type" "AUDIT_RESOURCE_TYPE" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_manager_id_idx" ON "vendors"("manager_id");

-- CreateIndex
CREATE INDEX "vendors_specialty_idx" ON "vendors"("specialty");

-- CreateIndex
CREATE INDEX "expenses_property_id_idx" ON "expenses"("property_id");

-- CreateIndex
CREATE INDEX "expenses_manager_id_idx" ON "expenses"("manager_id");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "maintenance_requests_vendor_id_idx" ON "maintenance_requests"("vendor_id");

-- AddForeignKey
ALTER TABLE "maintenance_requests" ADD CONSTRAINT "maintenance_requests_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_maintenance_request_id_fkey" FOREIGN KEY ("maintenance_request_id") REFERENCES "maintenance_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
