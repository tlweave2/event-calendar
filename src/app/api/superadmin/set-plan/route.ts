import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlanKey } from "@/lib/stripe";
import { safeCompare } from "@/lib/tokens";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * POST /api/superadmin/set-plan
 *   Header: x-superadmin-secret: <SUPERADMIN_SECRET>
 *   Body:   { "slug": "downtown-manteca", "plan": "PRO" }
 *
 * This was a GET with the secret in the query string, which meant the
 * credential was written into server access logs, browser history, and the
 * Referer header of any page it linked to. It is now a POST that carries the
 * secret in a header and compares it in constant time.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SUPERADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SUPERADMIN_SECRET not configured" },
      { status: 500 }
    );
  }

  // Slow down brute-force attempts against the secret.
  const limit = await rateLimit(
    `superadmin:${getClientIp(request.headers)}`,
    10,
    60 * 60
  );
  if (!limit.allowed) return tooManyRequests(limit);

  const provided = request.headers.get("x-superadmin-secret") ?? "";
  if (!safeCompare(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { slug?: string; plan?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, plan } = body;

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  if (!plan || !isPlanKey(plan)) {
    return NextResponse.json(
      { error: "plan must be FREE, PRO, or ENTERPRISE" },
      { status: 400 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, plan: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: `No tenant with slug "${slug}"` }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.tenant.update({ where: { slug }, data: { plan } }),
    // A plan change made outside Stripe should still leave a trail.
    prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: "tenant.plan_changed_by_superadmin",
        metadata: { from: tenant.plan, to: plan },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    tenant: slug,
    plan,
    message: `${slug} is now on the ${plan} plan.`,
  });
}
