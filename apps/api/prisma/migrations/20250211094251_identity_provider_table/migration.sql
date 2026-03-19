-- CreateTable
CREATE TABLE "identity_providers" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "identity_providers_clientId_key" ON "identity_providers"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "identity_providers_providerUserId_key" ON "identity_providers"("providerUserId");

-- AddForeignKey
ALTER TABLE "identity_providers" ADD CONSTRAINT "identity_providers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
