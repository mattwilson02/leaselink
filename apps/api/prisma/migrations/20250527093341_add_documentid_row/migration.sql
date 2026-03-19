/*
  Warnings:

  - Added the required column `document_id` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "document_id" TEXT NOT NULL;
