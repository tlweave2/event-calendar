import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. Reports database reachability and which optional
 * integrations are configured, so a misconfigured deployment is visible
 * without waiting for a customer to hit the broken path.
 */
export async function GET() {
  const startedAt = Date.now();

  let database: "ok" | "unreachable" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("[health] database check failed:", err);
    database = "unreachable";
  }

  const body = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    latencyMs: Date.now() - startedAt,
    integrations: {
      // Booleans only — never report the values themselves.
      billing: Boolean(process.env.STRIPE_SECRET_KEY),
      billingWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      email: Boolean(process.env.RESEND_API_KEY),
      uploads: Boolean(
        (process.env.AWS_ACCESS_KEY_ID ?? process.env.R2_ACCESS_KEY_ID) &&
          (process.env.AWS_BUCKET_NAME ?? process.env.R2_BUCKET_NAME)
      ),
      aiFlyer: Boolean(process.env.ANTHROPIC_API_KEY),
    },
  };

  return NextResponse.json(body, { status: database === "ok" ? 200 : 503 });
}
