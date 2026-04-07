UPDATE "tenants" SET "embedDefaultView" = 'grid' WHERE "embedDefaultView" = 'list';
ALTER TABLE "tenants" ALTER COLUMN "embedDefaultView" SET DEFAULT 'grid';
