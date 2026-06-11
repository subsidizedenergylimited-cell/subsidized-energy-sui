-- CreateTable
CREATE TABLE "Inverter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inverter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "passwordHash" TEXT,
    "suiAddress" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT,
    "custodial" BOOLEAN NOT NULL DEFAULT false,
    "srePoints" INTEGER NOT NULL DEFAULT 0,
    "hasInverterBonus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "custodial", "email", "encryptedPrivateKey", "id", "passwordHash", "srePoints", "suiAddress") SELECT "createdAt", "custodial", "email", "encryptedPrivateKey", "id", "passwordHash", "srePoints", "suiAddress" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_suiAddress_key" ON "User"("suiAddress");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
