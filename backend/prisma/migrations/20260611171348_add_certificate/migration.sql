-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "inverterId" TEXT NOT NULL,
    "productionDay" INTEGER NOT NULL,
    "wattHours" INTEGER NOT NULL,
    "walrusBlobId" TEXT NOT NULL,
    "certObjectId" TEXT NOT NULL,
    "txDigest" TEXT NOT NULL,
    "mintedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Certificate_inverterId_fkey" FOREIGN KEY ("inverterId") REFERENCES "Inverter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_userId_productionDay_key" ON "Certificate"("userId", "productionDay");
