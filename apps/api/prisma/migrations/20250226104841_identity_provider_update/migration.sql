/*
  Warnings:

  - You are about to drop the column `createdAt` on the `identity_providers` table. All the data in the column will be lost.
  - You are about to drop the column `providerUserId` on the `identity_providers` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `identity_providers` table. All the data in the column will be lost.
  - You are about to drop the column `userType` on the `identity_providers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[provider_user_id]` on the table `identity_providers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider_user_id` to the `identity_providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `identity_providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_type` to the `identity_providers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "identity_providers" DROP CONSTRAINT "identity_providers_clientId_fkey";

-- DropForeignKey
ALTER TABLE "identity_providers" DROP CONSTRAINT "identity_providers_employeeId_fkey";

-- DropIndex
DROP INDEX "identity_providers_providerUserId_key";

-- DropIndex
DROP INDEX "identity_providers_userId_key";

-- AlterTable
ALTER TABLE "identity_providers" DROP COLUMN "createdAt",
DROP COLUMN "providerUserId",
DROP COLUMN "userId",
DROP COLUMN "userType",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "provider_user_id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "user_type" "UserType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "identity_providers_provider_user_id_key" ON "identity_providers"("provider_user_id");
