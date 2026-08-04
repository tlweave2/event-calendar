-- Fix column naming drift on webhook_configs.
-- The table was created with snake_case columns, but the Prisma schema declares
-- camelCase fields with no @map, so every query against this table failed with
-- "column does not exist". Rename the columns to match the schema.
ALTER TABLE "webhook_configs" RENAME COLUMN "tenant_id" TO "tenantId";
ALTER TABLE "webhook_configs" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "webhook_configs" RENAME COLUMN "updated_at" TO "updatedAt";
ALTER INDEX "webhook_configs_tenant_id_key" RENAME TO "webhook_configs_tenantId_key";
ALTER TABLE "webhook_configs" RENAME CONSTRAINT "webhook_configs_tenant_id_fkey" TO "webhook_configs_tenantId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Existing accounts predate email verification. Grandfather them in so the
-- optional REQUIRE_EMAIL_VERIFICATION flag cannot lock out current customers.
UPDATE "users" SET "emailVerifiedAt" = "createdAt" WHERE "password" IS NOT NULL;

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "rate_limits_expiresAt_idx" ON "rate_limits"("expiresAt");

-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "id" VARCHAR(255) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processed_webhook_events_processedAt_idx" ON "processed_webhook_events"("processedAt");
