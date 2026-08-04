import { prisma } from "@/lib/prisma";
import { getPlanConfig, hasFeature, type PlanFeature } from "@/lib/stripe";

export type LimitCheck = {
  plan: string;
  current: number;
  limit: number;
  allowed: boolean;
};

async function getPlan(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true },
  });
  return tenant?.plan ?? "FREE";
}

/**
 * Monthly event quota.
 *
 * `needed` is how many events the caller is about to create. A recurring
 * series creates many rows at once, and checking as though it were a single
 * event let a 52-occurrence series through a 5-event limit.
 */
export async function checkEventLimit(
  tenantId: string,
  needed = 1
): Promise<LimitCheck & { needed: number; remaining: number }> {
  const plan = await getPlan(tenantId);
  const config = getPlanConfig(plan);

  const current = await prisma.event.count({
    where: { tenantId, createdAt: { gte: startOfMonth(new Date()) } },
  });

  const remaining = Math.max(0, config.monthlyEvents - current);

  return {
    plan,
    current,
    limit: config.monthlyEvents,
    needed,
    remaining,
    allowed: current + needed <= config.monthlyEvents,
  };
}

/**
 * Seat usage: existing members plus invitations that have been sent but not
 * yet redeemed. Counting only current members would let an owner send
 * unlimited invites and overshoot the plan as they were accepted.
 */
export async function checkSeatLimit(tenantId: string): Promise<LimitCheck> {
  const plan = await getPlan(tenantId);
  const config = getPlanConfig(plan);

  const [members, pendingInvites] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.verificationToken.count({
      where: {
        identifier: { startsWith: `invite:${tenantId}:` },
        expires: { gt: new Date() },
      },
    }),
  ]);

  const current = members + pendingInvites;

  return {
    plan,
    current,
    limit: config.seats,
    allowed: current < config.seats,
  };
}

export async function checkFeatureAccess(
  tenantId: string,
  feature: PlanFeature
): Promise<{ plan: string; allowed: boolean }> {
  const plan = await getPlan(tenantId);
  return { plan, allowed: hasFeature(plan, feature) };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
