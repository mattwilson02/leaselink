/*
  Warnings:

  - You are about to drop the column `permissions` on the `account_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `auth_service_user_id` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_auth_service_user_id_key";

-- AlterTable
ALTER TABLE "account_permissions" DROP COLUMN "permissions",
ADD COLUMN     "canView" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "auth_service_user_id",
ADD COLUMN     "managedById" TEXT;

-- DropEnum
DROP TYPE "Permission";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
