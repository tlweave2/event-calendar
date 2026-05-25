-- Change default embed view from list to grid and migrate existing rows
ALTER TABLE "tenants" ALTER COLUMN "embedDefaultView" SET DEFAULT 'grid';
UPDATE "tenants" SET "embedDefaultView" = 'grid' WHERE "embedDefaultView" = 'list';
