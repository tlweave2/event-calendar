-- CreateTable
CREATE TABLE "rate_limit_hits" (
    "id" TEXT NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rate_limit_hits_kind_key_createdAt_idx" ON "rate_limit_hits"("kind", "key", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_hits_createdAt_idx" ON "rate_limit_hits"("createdAt");
