import { PrismaClient } from "../generated/prisma";
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
