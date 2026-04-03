import { prisma } from "@/lib/prisma";

export const FREE_MONTHLY_EVENT_LIMIT = 25;
export const FREE_ADMIN_USER_LIMIT = 2;

export async function checkEventLimit(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const current = await prisma.event.count({
    where: {
      tenantId,
      createdAt: {
        gte: startOfMonth(new Date()),
      },
    },
  });

  const limit = tenant?.plan === "FREE" ? FREE_MONTHLY_EVENT_LIMIT : Infinity;

  return {
    plan: tenant?.plan ?? "FREE",
    current,
    limit,
    allowed: current < limit,
  };
}

export async function checkAdminUserLimit(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });

  const current = await prisma.user.count({
    where: {
      tenantId,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });

  const limit = tenant?.plan === "FREE" ? FREE_ADMIN_USER_LIMIT : Infinity;

  return {
    plan: tenant?.plan ?? "FREE",
    current,
    limit,
    allowed: current < limit,
  };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}