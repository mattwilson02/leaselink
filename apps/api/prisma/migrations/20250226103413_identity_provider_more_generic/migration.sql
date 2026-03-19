/*
  Warnings:

  - You are about to drop the column `clientId` on the `identity_providers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `identity_providers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `identity_providers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userType` to the `identity_providers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CLIENT', 'EMPLOYEE');

-- DropForeignKey
ALTER TABLE "identity_providers" DROP CONSTRAINT "identity_providers_clientId_fkey";

-- DropIndex
DROP INDEX "identity_providers_clientId_key";

-- AlterTable
ALTER TABLE "identity_providers" DROP COLUMN "clientId",
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "userType" "UserType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "identity_providers_userId_key" ON "identity_providers"("userId");

-- AddForeignKey
ALTER TABLE "identity_providers" ADD CONSTRAINT "identity_providers_clientId_fkey" FOREIGN KEY ("userId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_providers" ADD CONSTRAINT "identity_providers_employeeId_fkey" FOREIGN KEY ("userId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
