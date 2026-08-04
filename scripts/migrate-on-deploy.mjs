#!/usr/bin/env node
/**
 * Applies pending migrations during a deploy — but only for production.
 *
 * `prisma migrate deploy` used to run unconditionally inside `npm run build`,
 * which meant every preview deployment and every local `npm run build` also
 * migrated whatever database DATABASE_URL happened to point at. On Vercel
 * that is usually the production database, so opening a pull request could
 * migrate production ahead of the code that was supposed to ship with it.
 *
 * Preview builds now skip migrations. Set RUN_MIGRATIONS=1 to force them
 * (useful for a one-off deploy hook), or RUN_MIGRATIONS=0 to skip entirely.
 */
import { spawnSync } from "node:child_process";

const force = process.env.RUN_MIGRATIONS;
const vercelEnv = process.env.VERCEL_ENV;

function shouldMigrate() {
  if (force === "0" || force === "false") return false;
  if (force === "1" || force === "true") return true;
  // On Vercel: production deploys only. Off Vercel (CI, local): skip, and let
  // the operator run `npm run db:migrate` deliberately.
  return vercelEnv === "production";
}

if (!shouldMigrate()) {
  console.log(
    `[migrate] skipped (VERCEL_ENV=${vercelEnv ?? "unset"}). Run "npm run db:migrate" to apply migrations.`
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  console.error("[migrate] no DATABASE_URL/DIRECT_URL configured");
  process.exit(1);
}

console.log("[migrate] applying pending migrations");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
