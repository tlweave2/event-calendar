import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

async function createSandboxTenant() {
  const id = Math.random().toString(36).slice(2, 8);
  const slug = `demo-${id}`;

  const tenant = await prisma.tenant.create({
    data: {
      slug,
      name: "Riverside Community Events",
      primaryColor: "#7c3aed",
      secondaryColor: "#ede9fe",
      timezone: "America/Los_Angeles",
      plan: "PRO",
      isDemoSandbox: true,
      demoExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const cats = await Promise.all([
    prisma.category.create({ data: { tenantId: tenant.id, name: "Music", color: "#7c3aed", sortOrder: 0 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: "Food", color: "#ef4444", sortOrder: 1 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: "Arts", color: "#2563eb", sortOrder: 2 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: "Sports", color: "#16a34a", sortOrder: 3 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: "Community", color: "#d97706", sortOrder: 4 } }),
  ]);

  const now = new Date();
  const day = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    d.setHours(17, 0, 0, 0);
    return d;
  };

  await Promise.all([
    prisma.event.create({ data: { tenantId: tenant.id, title: "Summer Farmers Market", startAt: day(3), endAt: day(3), locationName: "City Plaza", categoryId: cats[1].id, cost: "Free", status: "APPROVED", submitterName: "Linda Park", submitterEmail: "linda@example.org", description: "40+ local vendors. Fresh produce, baked goods, and live music." } }),
    prisma.event.create({ data: { tenantId: tenant.id, title: "Downtown Art Walk", startAt: day(8), endAt: day(8), locationName: "Downtown Arts District", categoryId: cats[2].id, cost: "Free", status: "APPROVED", submitterName: "Marcus Webb", submitterEmail: "marcus@example.org", description: "Over 20 venues participating this month. Self-guided tour." } }),
    prisma.event.create({ data: { tenantId: tenant.id, title: "Acoustic Sunset Sessions", startAt: day(12), endAt: day(12), locationName: "Riverside Overlook", categoryId: cats[0].id, cost: "Free", status: "APPROVED", submitterName: "Jake Rivera", submitterEmail: "jake@example.org", description: "Singer-songwriters perform as the sun sets. Bring a blanket." } }),
    prisma.event.create({ data: { tenantId: tenant.id, title: "Taco Tuesday Throwdown", startAt: day(5), endAt: day(5), locationName: "Food Truck Park", categoryId: cats[1].id, cost: "$5", status: "PENDING", submitterName: "Maria Santos", submitterEmail: "maria@example.org", description: "Local restaurants compete for best taco. $5 tasting wristband." } }),
    prisma.event.create({ data: { tenantId: tenant.id, title: "Youth Soccer Tournament", startAt: day(7), endAt: day(7), locationName: "Riverside Sports Complex", categoryId: cats[3].id, cost: "Free", status: "PENDING", submitterName: "Coach Williams", submitterEmail: "coach@example.org", description: "U12 and U14 divisions. 16 teams over two days." } }),
    prisma.event.create({ data: { tenantId: tenant.id, title: "Open Mic Poetry Night", startAt: day(14), endAt: day(14), locationName: "The Book Nook Cafe", categoryId: cats[2].id, cost: "Free", status: "PENDING", submitterName: "Sarah Chen", submitterEmail: "sarah@example.org", description: "Share your original work or just listen. All levels welcome." } }),
  ]);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `demo-${id}@eventful.app`,
      name: "Demo Admin",
      role: "OWNER",
    },
  });

  return { user, tenant };
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET not configured" }, { status: 500 });
  }

  const { user, tenant } = await createSandboxTenant();

  const secureCookie = process.env.NODE_ENV === "production";
  const cookieName = secureCookie ? "__Secure-authjs.session-token" : "authjs.session-token";

  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      role: user.role,
    },
    secret,
    salt: cookieName,
    maxAge: 60 * 60,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return NextResponse.redirect(new URL("/admin", origin));
}
