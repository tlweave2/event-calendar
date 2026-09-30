-- The original webhook_configs migration created snake_case columns, but the
-- Prisma schema (and every other table) uses camelCase. Rename them so the
-- client's queries match. Each step is conditional, so this is safe on a
-- database that already has the camelCase columns (e.g. created with db push).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'webhook_configs' AND column_name = 'tenant_id') THEN
    ALTER TABLE "webhook_configs" RENAME COLUMN "tenant_id" TO "tenantId";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'webhook_configs' AND column_name = 'created_at') THEN
    ALTER TABLE "webhook_configs" RENAME COLUMN "created_at" TO "createdAt";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'webhook_configs' AND column_name = 'updated_at') THEN
    ALTER TABLE "webhook_configs" RENAME COLUMN "updated_at" TO "updatedAt";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'webhook_configs_tenant_id_key' AND n.nspname = current_schema()) THEN
    ALTER INDEX "webhook_configs_tenant_id_key" RENAME TO "webhook_configs_tenantId_key";
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'webhook_configs_tenant_id_fkey') THEN
    ALTER TABLE "webhook_configs" RENAME CONSTRAINT "webhook_configs_tenant_id_fkey" TO "webhook_configs_tenantId_fkey";
  END IF;
END $$;
