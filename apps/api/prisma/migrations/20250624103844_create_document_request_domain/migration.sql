/*
  Warnings:

  - You are about to drop the column `document_id` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `download_link` on the `documents` table. All the data in the column will be lost.
  - Added the required column `blob_name` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content_key` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `folder` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DOCUMENT_FOLDER" AS ENUM ('IDENTIFICATION', 'INVESTMENT_STATEMENTS', 'SIGNED_DOCUMENTS', 'CORRESPONDENTS', 'TAX_DOCUMENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "DOCUMENT_REQUEST_STATUS" AS ENUM ('PENDING', 'UPLOADED', 'CANCELED');

-- CreateEnum
CREATE TYPE "REQUEST_TYPE" AS ENUM ('PROOF_OF_ADDRESS', 'PROOF_OF_IDENTITY');

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "document_id",
DROP COLUMN "download_link",
ADD COLUMN     "blob_name" TEXT NOT NULL,
ADD COLUMN     "content_key" TEXT NOT NULL,
ADD COLUMN     "file_size" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "folder" "DOCUMENT_FOLDER" NOT NULL,
ADD COLUMN     "thumbnail_blob_name" TEXT;

-- CreateTable
CREATE TABLE "document_requests" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "content_key" TEXT,
    "requested_by" TEXT NOT NULL,
    "status" "DOCUMENT_REQUEST_STATUS" NOT NULL DEFAULT 'PENDING',
    "request_type" "REQUEST_TYPE" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "document_id" TEXT,

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "client_id" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_requests" ADD CONSTRAINT "document_id" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
