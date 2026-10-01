import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Change a tenant's plan. Protected by the SUPERADMIN_SECRET env var, sent in
 * the Authorization header so it never appears in URLs, browser history or
 * request logs:
 *
 *   curl -X POST https://<your-domain>/api/superadmin/set-plan \
 *     -H "Authorization: Bearer $SUPERADMIN_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"slug":"downtown-manteca","plan":"ENTERPRISE"}'
 */

const PLANS = ["FREE", "PRO", "ENTERPRISE"] as const;
type PlanName = (typeof PLANS)[number];

function isAuthorized(request: Request, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  // Compare digests so the check takes the same time whatever was sent.
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(secret).digest();
  return provided.length > 0 && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.SUPERADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SUPERADMIN_SECRET not configured" }, { status: 500 });
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { slug?: unknown; plan?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const plan = typeof body?.plan === "string" ? body.plan : "";

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  if (!PLANS.includes(plan as PlanName)) {
    return NextResponse.json({ error: "plan must be FREE, PRO, or ENTERPRISE" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return NextResponse.json({ error: `No tenant with slug "${slug}"` }, { status: 404 });
  }

  await prisma.tenant.update({
    where: { slug },
    data: { plan: plan as PlanName },
  });

  return NextResponse.json({
    ok: true,
    tenant: slug,
    plan,
    message: `${slug} is now on the ${plan} plan.`,
  });
}

// The old GET form put the secret in the query string. Point anyone still
// using it at the new form instead of silently accepting it.
export function GET() {
  return NextResponse.json(
    { error: "Use POST with an Authorization: Bearer header. See the comment in this route for an example." },
    { status: 405 },
  );
}
