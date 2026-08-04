import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeCompare } from "@/lib/tokens";

/**
 * Deletes expired demo sandboxes. Intended for a scheduled job (Vercel Cron
 * sends `Authorization: Bearer $CRON_SECRET`).
 *
 * The route deletes tenants, so it is gated behind a secret rather than being
 * open to anyone who finds the URL.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const provided = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!safeCompare(provided, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bounded per run so one invocation cannot lock a huge number of rows.
  const expired = await prisma.tenant.findMany({
    where: { isDemoSandbox: true, demoExpiresAt: { lt: new Date() } },
    select: { id: true },
    take: 500,
  });

  if (expired.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const { count } = await prisma.tenant.deleteMany({
    where: { id: { in: expired.map((t) => t.id) }, isDemoSandbox: true },
  });

  // Expired rate-limit windows accumulate too; this is a convenient moment.
  await prisma.rateLimit
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch((err) => console.error("[cleanup] rate limit sweep failed:", err));

  return NextResponse.json({ deleted: count });
}
