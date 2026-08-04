/**
 * Set a user's password directly against the database.
 *
 * Recovery hatch for two situations:
 *   - Email delivery is not configured yet, so the reset flow cannot send a
 *     link.
 *   - A legacy account has no password at all and predates the invitation
 *     flow that sets one.
 *
 * Usage:
 *   npm run set-password -- you@example.org 'a-strong-password'
 *   npm run set-password -- you@example.org 'pw' --tenant <tenantId>
 *
 * Requires DATABASE_URL (or DIRECT_URL) in the environment.
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const [, , emailArg, passwordArg, ...rest] = process.argv;

if (!emailArg || !passwordArg) {
  console.error(
    "Usage: npm run set-password -- <email> <password> [--tenant <tenantId>]"
  );
  process.exit(1);
}

if (passwordArg.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const tenantFlagIndex = rest.indexOf("--tenant");
const tenantId = tenantFlagIndex >= 0 ? rest[tenantFlagIndex + 1] : null;

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL (or DIRECT_URL) is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const email = emailArg.toLowerCase().trim();

async function main() {
  const users = await prisma.user.findMany({
    where: { email, ...(tenantId ? { tenantId } : {}) },
    select: {
      id: true,
      email: true,
      role: true,
      password: true,
      tenant: { select: { id: true, slug: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    console.error(
      `No user found with email ${email}${tenantId ? ` in tenant ${tenantId}` : ""}.`
    );
    process.exitCode = 1;
    return;
  }

  // The same address can exist in several tenants. Refuse to guess.
  if (users.length > 1 && !tenantId) {
    console.error(
      `${email} exists in ${users.length} workspaces. Re-run with --tenant <tenantId>:\n`
    );
    for (const user of users) {
      console.error(`  ${user.tenant.id}  ${user.tenant.slug.padEnd(24)} ${user.role}`);
    }
    process.exitCode = 1;
    return;
  }

  const user = users[0];
  const hash = await bcrypt.hash(passwordArg, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash, emailVerifiedAt: new Date() },
  });

  console.log(
    `Password ${user.password ? "updated" : "set"} for ${user.email} (${user.role}) in "${user.tenant.name}".`
  );
  console.log("Sign in at /admin/login.");
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
