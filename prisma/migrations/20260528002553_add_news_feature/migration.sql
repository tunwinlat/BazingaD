-- CreateTable
CREATE TABLE "news_feeds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "news_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phrase" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalTitle" TEXT NOT NULL,
    "aiTitle" TEXT,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "sourceFeedId" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "contentHash" TEXT NOT NULL,
    CONSTRAINT "news_articles_sourceFeedId_fkey" FOREIGN KEY ("sourceFeedId") REFERENCES "news_feeds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteTitle" TEXT NOT NULL DEFAULT 'Start Page',
    "favicon" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "defaultView" TEXT NOT NULL DEFAULT 'comfortable',
    "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "navTransitionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "navTransitionType" TEXT NOT NULL DEFAULT 'overlay',
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
    "trafficTomTomApiKey" TEXT,
    "trafficPrimaryProvider" TEXT NOT NULL DEFAULT 'google',
    "trafficHomeAddress" TEXT,
    "trafficWorkAddress" TEXT,
    "trafficTravelMode" TEXT NOT NULL DEFAULT 'DRIVE',
    "trafficUnits" TEXT NOT NULL DEFAULT 'metric',
    "newsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "newsApiKey" TEXT,
    "newsCheckIntervalMinutes" INTEGER NOT NULL DEFAULT 60,
    "newsUnreadRetentionHours" INTEGER NOT NULL DEFAULT 24,
    "newsReadRetentionHours" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("createdAt", "dashboardPassword", "dashboardProtected", "defaultView", "favicon", "id", "navTransitionEnabled", "navTransitionType", "openInNewTab", "sessionDurationHours", "siteTitle", "theme", "trafficApiKey", "trafficEnabled", "trafficHomeAddress", "trafficPrimaryProvider", "trafficTomTomApiKey", "trafficTravelMode", "trafficUnits", "trafficWorkAddress", "updatedAt", "weatherEnabled", "weatherLatitude", "weatherLocationName", "weatherLongitude", "weatherUnits") SELECT "createdAt", "dashboardPassword", "dashboardProtected", "defaultView", "favicon", "id", "navTransitionEnabled", "navTransitionType", "openInNewTab", "sessionDurationHours", "siteTitle", "theme", "trafficApiKey", "trafficEnabled", "trafficHomeAddress", "trafficPrimaryProvider", "trafficTomTomApiKey", "trafficTravelMode", "trafficUnits", "trafficWorkAddress", "updatedAt", "weatherEnabled", "weatherLatitude", "weatherLocationName", "weatherLongitude", "weatherUnits" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "news_topics_phrase_key" ON "news_topics"("phrase");

-- CreateIndex
CREATE UNIQUE INDEX "news_articles_contentHash_key" ON "news_articles"("contentHash");
