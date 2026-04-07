-- Add tenant-level embed customization defaults
ALTER TABLE "tenants"
ADD COLUMN "embedFontFamily" VARCHAR(100),
ADD COLUMN "embedDefaultView" VARCHAR(10) NOT NULL DEFAULT 'grid',
ADD COLUMN "embedHideSearch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "embedHideCategories" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "embedHideSubmit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "embedBgColor" VARCHAR(20),
ADD COLUMN "embedDarkMode" BOOLEAN NOT NULL DEFAULT false;
