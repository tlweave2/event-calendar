import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/superadmin/set-plan?secret=XXX&slug=downtown-manteca&plan=PRO
 *
 * Protected by the SUPERADMIN_SECRET env var. Only the app owner should
 * know this value. Set it in Vercel → Project → Environment Variables.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const secret = process.env.SUPERADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SUPERADMIN_SECRET not configured" }, { status: 500 });
  }
  if (searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = searchParams.get("slug");
  const plan = searchParams.get("plan");

  if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
  if (!plan || !["FREE", "PRO", "ENTERPRISE"].includes(plan)) {
    return NextResponse.json({ error: "plan must be FREE, PRO, or ENTERPRISE" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return NextResponse.json({ error: `No tenant with slug "${slug}"` }, { status: 404 });
  }

  await prisma.tenant.update({
    where: { slug },
    data: { plan: plan as "FREE" | "PRO" | "ENTERPRISE" },
  });

  return NextResponse.json({
    ok: true,
    tenant: slug,
    plan,
    message: `${slug} is now on the ${plan} plan.`,
  });
}
