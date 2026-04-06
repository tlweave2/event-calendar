import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ─── Tenant ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: "test" },
    update: {},
    create: {
      slug: "test",
      name: "Test Organization",
      primaryColor: "#2563eb",
      secondaryColor: "#dbeafe",
      timezone: "America/Los_Angeles",
      plan: "FREE",
    },
  });

  console.log("✓ Tenant:", tenant.slug, tenant.id);

  // ─── Categories ───────────────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: "00000000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000001",
        tenantId: tenant.id,
        name: "Music",
        color: "#7c3aed",
        sortOrder: 0,
      },
    }),
    prisma.category.upsert({
      where: { id: "00000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000002",
        tenantId: tenant.id,
        name: "Arts & Culture",
        color: "#db2777",
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { id: "00000000-0000-0000-0000-000000000003" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000003",
        tenantId: tenant.id,
        name: "Community",
        color: "#16a34a",
        sortOrder: 2,
      },
    }),
  ]);

  console.log("✓ Categories:", categories.map((c) => c.name).join(", "));

  // ─── Pending Events ───────────────────────────────────────────────────────
  const events = await Promise.all([
    prisma.event.create({
      data: {
        tenantId: tenant.id,
        title: "Summer Jazz in the Park",
        description:
          "An evening of live jazz performances featuring local musicians. Bring a blanket and enjoy the show under the stars.",
        startAt: new Date("2026-07-12T19:00:00Z"),
        endAt: new Date("2026-07-12T22:00:00Z"),
        locationName: "Riverside Park Amphitheater",
        address: "123 River Rd, Testville, CA 95210",
        categoryId: categories[0].id,
        submitterName: "Sarah Chen",
        submitterEmail: "sarah@localarts.org",
        cost: "Free",
        status: "PENDING",
      },
    }),
    prisma.event.create({
      data: {
        tenantId: tenant.id,
        title: "Downtown Art Walk",
        description:
          "Monthly self-guided tour of downtown galleries and studios. Over 20 venues participating this month.",
        startAt: new Date("2026-07-18T17:00:00Z"),
        endAt: new Date("2026-07-18T21:00:00Z"),
        locationName: "Downtown Arts District",
        address: "Main St & 1st Ave, Testville, CA 95210",
        categoryId: categories[1].id,
        submitterName: "Marcus Webb",
        submitterEmail: "marcus@downtownarts.org",
        cost: "Free",
        status: "PENDING",
      },
    }),
    prisma.event.create({
      data: {
        tenantId: tenant.id,
        title: "Farmers Market Opening Day",
        description:
          "The seasonal farmers market returns with 40+ local vendors. Fresh produce, baked goods, and live music.",
        startAt: new Date("2026-07-05T08:00:00Z"),
        endAt: new Date("2026-07-05T13:00:00Z"),
        locationName: "City Plaza",
        address: "500 City Plaza Dr, Testville, CA 95210",
        categoryId: categories[2].id,
        submitterName: "Linda Park",
        submitterEmail: "linda@testvillefarmers.org",
        cost: "Free admission",
        status: "PENDING",
      },
    }),
  ]);

  console.log("✓ Events:", events.map((e) => e.title).join(", "));

  // ─── Admin User ───────────────────────────────────────────────────────────
  // Replace this email with yours before running
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: "admin@test.com",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@test.com",
      name: "Test Admin",
      role: "OWNER",
    },
  });

  console.log("✓ Admin user:", user.email);

  // ─── Demo Tenant (for landing page live demo) ───────────────────────────
  const demo = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      slug: "demo",
      name: "Riverside Community Events",
      primaryColor: "#7c3aed",
      secondaryColor: "#ede9fe",
      timezone: "America/Los_Angeles",
      plan: "PRO",
    },
  });

  // Keep demo deterministic on re-seed.
  await prisma.event.deleteMany({ where: { tenantId: demo.id } });
  await prisma.category.deleteMany({ where: { tenantId: demo.id } });

  const demoCategories = await Promise.all([
    prisma.category.create({
      data: {
        tenantId: demo.id,
        name: "Music",
        color: "#ec4899",
        sortOrder: 0,
      },
    }),
    prisma.category.create({
      data: {
        tenantId: demo.id,
        name: "Food & Drink",
        color: "#f59e0b",
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        tenantId: demo.id,
        name: "Arts",
        color: "#8b5cf6",
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        tenantId: demo.id,
        name: "Sports",
        color: "#10b981",
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        tenantId: demo.id,
        name: "Community",
        color: "#3b82f6",
        sortOrder: 4,
      },
    }),
  ]);

  const now = new Date();
  const demoEvents = [
    {
      title: "Summer Jazz Festival",
      desc: "Three stages of live jazz in the park. Bring a blanket and enjoy world-class musicians.",
      location: "Riverside Park Amphitheater",
      address: "200 Park Ave, Riverside, CA",
      cat: 0,
      status: "APPROVED",
      daysFromNow: 5,
      duration: 6,
    },
    {
      title: "Night Market",
      desc: "Street food from 25+ local vendors, craft cocktails, and live DJ sets under string lights.",
      location: "Old Town Square",
      address: "100 Main St, Riverside, CA",
      cat: 1,
      status: "APPROVED",
      daysFromNow: 8,
      duration: 4,
    },
    {
      title: "Mural Walk & Gallery Hop",
      desc: "Guided walking tour of downtown murals followed by open galleries with artist meet-and-greets.",
      location: "Arts District",
      address: "500 Gallery Row, Riverside, CA",
      cat: 2,
      status: "APPROVED",
      daysFromNow: 12,
      duration: 3,
    },
    {
      title: "5K Fun Run",
      desc: "Family-friendly fun run along the river trail. All paces welcome. Medals for all finishers.",
      location: "River Trail Start",
      address: "1 River Rd, Riverside, CA",
      cat: 3,
      status: "APPROVED",
      daysFromNow: 15,
      duration: 2,
    },
    {
      title: "Community Potluck & Game Night",
      desc: "Bring a dish to share! Board games, card games, and trivia provided. All ages welcome.",
      location: "Community Center",
      address: "300 Civic Dr, Riverside, CA",
      cat: 4,
      status: "APPROVED",
      daysFromNow: 3,
      duration: 3,
    },
    {
      title: "Open Mic Poetry Night",
      desc: "Share your original work or just listen. Supportive and inclusive atmosphere.",
      location: "The Book Nook Cafe",
      address: "42 Elm St, Riverside, CA",
      cat: 2,
      status: "APPROVED",
      daysFromNow: 18,
      duration: 2,
    },
    {
      title: "Taco Tuesday Throwdown",
      desc: "Local restaurants compete for best taco. You be the judge! $5 tasting wristband.",
      location: "Food Truck Park",
      address: "800 Commerce Blvd, Riverside, CA",
      cat: 1,
      status: "PENDING",
      daysFromNow: 20,
      duration: 3,
      submitter: "Maria Santos",
      email: "maria@tacotuesday.com",
    },
    {
      title: "Youth Soccer Tournament",
      desc: "U12 and U14 divisions. 16 teams competing over two days.",
      location: "Riverside Sports Complex",
      address: "1500 Stadium Way, Riverside, CA",
      cat: 3,
      status: "PENDING",
      daysFromNow: 22,
      duration: 8,
      submitter: "Coach Williams",
      email: "coach@youthsoccer.org",
    },
    {
      title: "Acoustic Sunset Sessions",
      desc: "Singer-songwriters perform as the sun sets over the river. BYOB.",
      location: "Riverside Overlook",
      address: "50 Bluff St, Riverside, CA",
      cat: 0,
      status: "PENDING",
      daysFromNow: 25,
      duration: 3,
      submitter: "Jake Rivera",
      email: "jake@acousticsunset.com",
    },
  ] as const;

  await Promise.all(
    demoEvents.map((e) => {
      const start = new Date(now.getTime() + e.daysFromNow * 86400000);
      start.setHours(17, 0, 0, 0);
      const end = new Date(start.getTime() + e.duration * 3600000);

      return prisma.event.create({
        data: {
          tenantId: demo.id,
          title: e.title,
          description: e.desc,
          startAt: start,
          endAt: end,
          locationName: e.location,
          address: e.address,
          categoryId: demoCategories[e.cat].id,
          status: e.status,
          cost: "Free",
          submitterName: e.submitter ?? "Demo Admin",
          submitterEmail: e.email ?? "demo@eventful.app",
        },
      });
    })
  );

  const demoUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demo.id,
        email: "demo@eventful.app",
      },
    },
    update: {},
    create: {
      tenantId: demo.id,
      email: "demo@eventful.app",
      name: "Demo Admin",
      role: "OWNER",
    },
  });

  console.log("✓ Demo tenant seeded:", demo.slug);
  console.log("✓ Demo admin user:", demoUser.email);
  console.log("\nDone. Visit http://localhost:3000/embed/test/submit");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
