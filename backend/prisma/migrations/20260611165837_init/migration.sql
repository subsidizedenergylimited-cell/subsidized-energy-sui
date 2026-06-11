-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT,
    "suiAddress" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT,
    "custodial" BOOLEAN NOT NULL DEFAULT false,
    "srePoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WalletNonce" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "address" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_suiAddress_key" ON "User"("suiAddress");

-- CreateIndex
CREATE UNIQUE INDEX "WalletNonce_address_key" ON "WalletNonce"("address");
