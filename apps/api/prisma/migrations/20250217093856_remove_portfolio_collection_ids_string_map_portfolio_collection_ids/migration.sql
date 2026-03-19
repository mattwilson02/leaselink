/*
  Warnings:

  - You are about to drop the column `portfolio_collection_ids` on the `clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "identity_providers" DROP CONSTRAINT "identity_providers_clientId_fkey";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "portfolio_collection_ids";

-- AddForeignKey
ALTER TABLE "identity_providers" ADD CONSTRAINT "identity_providers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
