import { prisma } from "@/lib/prisma";
import { getPlanConfig, PLANS } from "@/lib/stripe";

/**
 * Cross-tenant reporting for the operator console.
 *
 * Every other query in the app is scoped to a single tenant, which is correct
 * for customers and useless for running the business. This module is the one
 * place allowed to look across all of them, and it is only reachable from
 * /superadmin.
 */

/** Pro is billed annually; report the annualised figure and its monthly equivalent. */
const PRO_ANNUAL_PRICE_USD = 99;

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  plan: string;
  isDemo: boolean;
  createdAt: Date;
  eventsTotal: number;
  eventsThisMonth: number;
  monthlyLimit: number;
  seatsUsed: number;
  pendingEvents: number;
  lastActivityAt: Date | null;
  stripeCustomerId: string | null;
  atLimit: boolean;
};

export type OperatorSummary = {
  tenants: number;
  payingTenants: number;
  freeTenants: number;
  demoTenants: number;
  arrUsd: number;
  mrrUsd: number;
  signupsLast30Days: number;
  eventsLast30Days: number;
  tenantsAtLimit: number;
  staleTenants: number;
};

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getOperatorDashboard(): Promise<{
  summary: OperatorSummary;
  rows: TenantRow[];
}> {
  const monthStart = startOfMonth();
  const thirtyDaysAgo = daysAgo(30);

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      plan: true,
      createdAt: true,
      isDemoSandbox: true,
      stripeCustomerId: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Three grouped queries rather than per-tenant lookups, so the console stays
  // usable as the tenant count grows.
  const [eventTotals, eventsThisMonth, pendingCounts, latestEvents] = await Promise.all([
    prisma.event.groupBy({ by: ["tenantId"], _count: { id: true } }),
    prisma.event.groupBy({
      by: ["tenantId"],
      where: { createdAt: { gte: monthStart } },
      _count: { id: true },
    }),
    prisma.event.groupBy({
      by: ["tenantId"],
      where: { status: "PENDING" },
      _count: { id: true },
    }),
    prisma.event.groupBy({ by: ["tenantId"], _max: { createdAt: true } }),
  ]);

  const totalBy = indexCount(eventTotals);
  const monthBy = indexCount(eventsThisMonth);
  const pendingBy = indexCount(pendingCounts);
  const lastActivityBy = new Map(
    latestEvents.map((row) => [row.tenantId, row._max.createdAt ?? null])
  );

  const rows: TenantRow[] = tenants.map((tenant) => {
    const config = getPlanConfig(tenant.plan);
    const eventsThisMonthCount = monthBy.get(tenant.id) ?? 0;

    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan,
      isDemo: tenant.isDemoSandbox,
      createdAt: tenant.createdAt,
      eventsTotal: totalBy.get(tenant.id) ?? 0,
      eventsThisMonth: eventsThisMonthCount,
      monthlyLimit: config.monthlyEvents,
      seatsUsed: tenant._count.users,
      pendingEvents: pendingBy.get(tenant.id) ?? 0,
      lastActivityAt: lastActivityBy.get(tenant.id) ?? null,
      stripeCustomerId: tenant.stripeCustomerId,
      atLimit:
        Number.isFinite(config.monthlyEvents) &&
        eventsThisMonthCount >= config.monthlyEvents,
    };
  });

  // Demo sandboxes are noise in every business number.
  const real = rows.filter((row) => !row.isDemo);
  const paying = real.filter((row) => row.plan !== "FREE");

  const arrUsd = paying.length * PRO_ANNUAL_PRICE_USD;

  const summary: OperatorSummary = {
    tenants: real.length,
    payingTenants: paying.length,
    freeTenants: real.length - paying.length,
    demoTenants: rows.length - real.length,
    arrUsd,
    mrrUsd: Math.round((arrUsd / 12) * 100) / 100,
    signupsLast30Days: real.filter((row) => row.createdAt >= thirtyDaysAgo).length,
    eventsLast30Days: await prisma.event.count({
      where: { createdAt: { gte: thirtyDaysAgo }, tenant: { isDemoSandbox: false } },
    }),
    // Free tenants sitting at their cap are the upgrade conversations.
    tenantsAtLimit: real.filter((row) => row.atLimit).length,
    // No event in 30 days: the churn signal worth acting on.
    staleTenants: real.filter(
      (row) => !row.lastActivityAt || row.lastActivityAt < thirtyDaysAgo
    ).length,
  };

  return { summary, rows: real.concat(rows.filter((row) => row.isDemo)) };
}

function indexCount(rows: { tenantId: string; _count: { id: number } }[]) {
  return new Map(rows.map((row) => [row.tenantId, row._count.id]));
}

export const PLAN_NAMES = Object.fromEntries(
  Object.entries(PLANS).map(([key, config]) => [key, config.name])
);
