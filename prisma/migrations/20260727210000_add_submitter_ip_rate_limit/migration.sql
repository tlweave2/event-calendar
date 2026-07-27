ALTER TABLE "events" ADD COLUMN "submitterIp" VARCHAR(45);

CREATE INDEX "events_tenantId_submitterEmail_createdAt_idx" ON "events"("tenantId", "submitterEmail", "createdAt");
CREATE INDEX "events_tenantId_submitterIp_createdAt_idx" ON "events"("tenantId", "submitterIp", "createdAt");
