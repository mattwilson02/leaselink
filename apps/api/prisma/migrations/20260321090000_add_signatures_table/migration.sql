-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "signed_by" TEXT NOT NULL,
    "signature_image_key" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "signatures_document_id_key" ON "signatures"("document_id");

-- CreateIndex
CREATE INDEX "signatures_document_id_idx" ON "signatures"("document_id");

-- CreateIndex
CREATE INDEX "signatures_signed_by_idx" ON "signatures"("signed_by");

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
