/*
  Warnings:

  - You are about to drop the column `key` on the `settings` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `settings` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `settings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dashboardProtected" BOOLEAN NOT NULL DEFAULT false,
    "dashboardPassword" TEXT,
    "sessionDurationHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("id") SELECT "id" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryCode" TEXT,
    "passwordChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "id", "password", "recoveryCode", "totpEnabled", "totpSecret", "totpVerified", "updatedAt", "username") SELECT "createdAt", "id", "password", "recoveryCode", "totpEnabled", "totpSecret", "totpVerified", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
