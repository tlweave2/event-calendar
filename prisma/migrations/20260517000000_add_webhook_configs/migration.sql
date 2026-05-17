-- CreateTable
CREATE TABLE "public"."webhook_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "webhook_configs_tenant_id_key" ON "public"."webhook_configs"("tenant_id");

-- AddForeignKey
ALTER TABLE "public"."webhook_configs" ADD CONSTRAINT "webhook_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;