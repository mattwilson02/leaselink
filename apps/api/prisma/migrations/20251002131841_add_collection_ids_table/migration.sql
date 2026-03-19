-- CreateTable
CREATE TABLE "collection_ids" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "collection_id" INTEGER NOT NULL,

    CONSTRAINT "collection_ids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collection_ids_client_id_collection_id_key" ON "collection_ids"("client_id", "collection_id");

-- AddForeignKey
ALTER TABLE "collection_ids" ADD CONSTRAINT "collection_ids_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
