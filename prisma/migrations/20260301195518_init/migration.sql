-- CreateTable
CREATE TABLE "users" (
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

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteTitle" TEXT NOT NULL DEFAULT 'Start Page',
    "favicon" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "dashboardProtected" BOOLEAN NOT NULL DEFAULT false,
    "dashboardPassword" TEXT,
    "sessionDurationHours" INTEGER NOT NULL DEFAULT 24,
    "weatherEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weatherLatitude" REAL,
    "weatherLongitude" REAL,
    "weatherLocationName" TEXT,
    "weatherUnits" TEXT NOT NULL DEFAULT 'metric',
    "trafficEnabled" BOOLEAN NOT NULL DEFAULT false,
    "trafficApiKey" TEXT,
    "trafficHomeAddress" TEXT,
    "trafficWorkAddress" TEXT,
    "trafficTravelMode" TEXT NOT NULL DEFAULT 'DRIVE',
    "trafficUnits" TEXT NOT NULL DEFAULT 'metric',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'default',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "serviceUrl" TEXT,
    "serviceType" TEXT,
    "healthCheckUrl" TEXT,
    "isMonitored" BOOLEAN NOT NULL DEFAULT false,
    "lastStatus" TEXT,
    "lastCheckedAt" DATETIME,
    CONSTRAINT "blocks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "traffic_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeToWorkDuration" INTEGER NOT NULL,
    "homeToWorkStatic" INTEGER NOT NULL,
    "workToHomeDuration" INTEGER NOT NULL,
    "workToHomeStatic" INTEGER NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
