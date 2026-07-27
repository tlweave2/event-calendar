ALTER TABLE "tenants" ADD COLUMN "googleCalendarAccessToken" TEXT;
ALTER TABLE "tenants" ADD COLUMN "googleCalendarRefreshToken" TEXT;
ALTER TABLE "tenants" ADD COLUMN "googleCalendarTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "tenants" ADD COLUMN "googleCalendarId" VARCHAR(255);
ALTER TABLE "tenants" ADD COLUMN "googleCalendarSummary" VARCHAR(255);
ALTER TABLE "tenants" ADD COLUMN "googleCalendarSyncEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "tenants" ADD COLUMN "googleCalendarPushEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "events" ADD COLUMN "googleEventId" VARCHAR(255);
