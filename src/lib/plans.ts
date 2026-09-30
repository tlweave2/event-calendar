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

export function getPlanConfig(plan: string) {
  return PLANS[plan as PlanKey] ?? PLANS.FREE;
}

export function hasFeature(
  plan: string,
  feature: keyof (typeof PLANS)["PRO"]
): boolean {
  const config = getPlanConfig(plan);
  return Boolean(config[feature]);
}

/** True for any plan someone pays for (Pro or Enterprise). */
export function isPaidPlan(plan: string): boolean {
  return plan === "PRO" || plan === "ENTERPRISE";
}
