import { prisma } from "@/lib/prisma";
import { getPlanConfig, hasFeature } from "@/lib/stripe";

export async function checkEventLimit(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? "FREE";
  const config = getPlanConfig(plan);

  const current = await prisma.event.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth(new Date()) },
    },
  });

  return {
    plan,
    current,
    limit: config.monthlyEvents,
    allowed: current < config.monthlyEvents,
  };
}

export async function checkAdminUserLimit(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? "FREE";
  const config = getPlanConfig(plan);

  const current = await prisma.user.count({
    where: { tenantId, role: { in: ["OWNER", "ADMIN"] } },
  });

  return {
    plan,
    current,
    limit: config.adminUsers,
    allowed: current < config.adminUsers,
  };
}

export async function checkFeatureAccess(
  tenantId: string,
  feature: "aiFlyer" | "removeBadge"
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const plan = tenant?.plan ?? "FREE";
  return { plan, allowed: hasFeature(plan, feature) };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}