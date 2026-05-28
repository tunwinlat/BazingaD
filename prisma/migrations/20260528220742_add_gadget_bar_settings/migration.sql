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
    "newsMaxArticleAgeHours" INTEGER NOT NULL DEFAULT 24,
    "gadgetBarLeftEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gadgetBarRightEnabled" BOOLEAN NOT NULL DEFAULT false,
    "gadgetBarLeftConfig" TEXT NOT NULL DEFAULT '[]',
    "gadgetBarRightConfig" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("createdAt", "dashboardPassword", "dashboardProtected", "defaultView", "favicon", "id", "navTransitionEnabled", "navTransitionType", "newsApiKey", "newsCheckIntervalMinutes", "newsEnabled", "newsMaxArticleAgeHours", "newsReadRetentionHours", "newsUnreadRetentionHours", "openInNewTab", "sessionDurationHours", "siteTitle", "theme", "trafficApiKey", "trafficEnabled", "trafficHomeAddress", "trafficPrimaryProvider", "trafficTomTomApiKey", "trafficTravelMode", "trafficUnits", "trafficWorkAddress", "updatedAt", "weatherEnabled", "weatherLatitude", "weatherLocationName", "weatherLongitude", "weatherUnits") SELECT "createdAt", "dashboardPassword", "dashboardProtected", "defaultView", "favicon", "id", "navTransitionEnabled", "navTransitionType", "newsApiKey", "newsCheckIntervalMinutes", "newsEnabled", "newsMaxArticleAgeHours", "newsReadRetentionHours", "newsUnreadRetentionHours", "openInNewTab", "sessionDurationHours", "siteTitle", "theme", "trafficApiKey", "trafficEnabled", "trafficHomeAddress", "trafficPrimaryProvider", "trafficTomTomApiKey", "trafficTravelMode", "trafficUnits", "trafficWorkAddress", "updatedAt", "weatherEnabled", "weatherLatitude", "weatherLocationName", "weatherLongitude", "weatherUnits" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
