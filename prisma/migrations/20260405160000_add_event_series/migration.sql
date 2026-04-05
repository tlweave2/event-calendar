CREATE TABLE "event_series" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "rule" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_series_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_series_tenantId_idx" ON "event_series"("tenantId");

ALTER TABLE "event_series" ADD CONSTRAINT "event_series_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "events" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "events" ADD COLUMN "seriesIndex" INTEGER;

ALTER TABLE "events" ADD CONSTRAINT "events_seriesId_fkey"
  FOREIGN KEY ("seriesId") REFERENCES "event_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "events_seriesId_idx" ON "events"("seriesId");
