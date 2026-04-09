CREATE TABLE "calendar_views" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "categoryIds" TEXT[] NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "calendar_views_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "calendar_views"
ADD CONSTRAINT "calendar_views_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "calendar_views_tenantId_slug_key" ON "calendar_views"("tenantId", "slug");
CREATE INDEX "calendar_views_tenantId_idx" ON "calendar_views"("tenantId");
