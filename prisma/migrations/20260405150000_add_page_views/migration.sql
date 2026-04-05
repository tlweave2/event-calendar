CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "page" VARCHAR(50) NOT NULL,
    "eventId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "page_views_tenantId_idx" ON "page_views"("tenantId");
CREATE INDEX "page_views_tenantId_viewedAt_idx" ON "page_views"("tenantId", "viewedAt");

ALTER TABLE "page_views" ADD CONSTRAINT "page_views_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "page_views" ADD CONSTRAINT "page_views_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
