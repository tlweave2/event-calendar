// Plan limits and feature flags. Kept free of the Stripe SDK so client
// components can import it.

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    monthlyEvents: 5,
    adminUsers: 1,
    aiFlyer: false,
    removeBadge: false,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    monthlyEvents: Infinity,
    adminUsers: 1,
    aiFlyer: true,
    removeBadge: true,
  },
  // Sales-led: set by hand via /api/superadmin/set-plan and billed by invoice,
  // so it has no Stripe price and the Stripe webhook never touches it.
  ENTERPRISE: {
    name: "Enterprise",
    priceId: null,
    monthlyEvents: Infinity,
    adminUsers: 25,
    aiFlyer: true,
    removeBadge: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Eventful is currently free: every calendar gets everything, whatever plan
 * is stored on it. The paid plans above, Stripe checkout and the billing
 * webhook are kept so this can be switched off later.
 */
export const EVERYTHING_FREE = true;

/** Applied to every calendar while EVERYTHING_FREE is on. */
export const FREE_FOR_ALL = {
  name: "Free",
  priceId: null,
  monthlyEvents: Infinity,
  adminUsers: 25,
  aiFlyer: true,
  removeBadge: true,
} as const;

/** Each scan calls the Claude API, so cap them per calendar per month. */
export const FLYER_SCANS_PER_MONTH = 50;

export type PlanConfig = {
  name: string;
  priceId: string | null;
  monthlyEvents: number;
  adminUsers: number;
  aiFlyer: boolean;
  removeBadge: boolean;
};

export function getPlanConfig(plan: string, everythingFree = EVERYTHING_FREE): PlanConfig {
  if (everythingFree) return FREE_FOR_ALL;
  return getStoredPlanConfig(plan);
}

/** The plan's own limits, ignoring EVERYTHING_FREE. */
export function getStoredPlanConfig(plan: string): PlanConfig {
  return PLANS[plan as PlanKey] ?? PLANS.FREE;
}

export function hasFeature(
  plan: string,
  feature: "aiFlyer" | "removeBadge",
  everythingFree = EVERYTHING_FREE,
): boolean {
  const config = getPlanConfig(plan, everythingFree);
  return Boolean(config[feature]);
}

/** True for any plan someone pays for (Pro or Enterprise). */
export function isPaidPlan(plan: string): boolean {
  return plan === "PRO" || plan === "ENTERPRISE";
}
