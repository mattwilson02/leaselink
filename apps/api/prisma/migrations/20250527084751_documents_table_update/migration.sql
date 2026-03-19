/*
  Warnings:

  - You are about to drop the column `content_type` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `storage_path` on the `documents` table. All the data in the column will be lost.
  - Added the required column `download_link` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "content_type",
DROP COLUMN "deleted_at",
DROP COLUMN "size",
DROP COLUMN "storage_path",
ADD COLUMN     "download_link" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
