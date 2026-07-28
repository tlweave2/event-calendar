CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "unsubscribeToken" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscribers_unsubscribeToken_key" ON "subscribers"("unsubscribeToken");
CREATE UNIQUE INDEX "subscribers_tenantId_email_key" ON "subscribers"("tenantId", "email");
CREATE INDEX "subscribers_tenantId_idx" ON "subscribers"("tenantId");

ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
