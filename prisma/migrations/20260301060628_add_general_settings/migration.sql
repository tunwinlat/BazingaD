-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteTitle" TEXT NOT NULL DEFAULT 'Start Page',
    "favicon" TEXT,
    "dashboardProtected" BOOLEAN NOT NULL DEFAULT false,
    "dashboardPassword" TEXT,
    "sessionDurationHours" INTEGER NOT NULL DEFAULT 24,
    "weatherEnabled" BOOLEAN NOT NULL DEFAULT false,
    "weatherLatitude" REAL,
    "weatherLongitude" REAL,
    "weatherLocationName" TEXT,
    "weatherUnits" TEXT NOT NULL DEFAULT 'metric',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_settings" ("createdAt", "dashboardPassword", "dashboardProtected", "id", "sessionDurationHours", "updatedAt", "weatherEnabled", "weatherLatitude", "weatherLocationName", "weatherLongitude", "weatherUnits") SELECT "createdAt", "dashboardPassword", "dashboardProtected", "id", "sessionDurationHours", "updatedAt", "weatherEnabled", "weatherLatitude", "weatherLocationName", "weatherLongitude", "weatherUnits" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
