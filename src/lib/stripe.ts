import Stripe from "stripe";

let client: Stripe | null = null;

export function isBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Lazily construct the Stripe client.
 *
 * Constructing it at module scope with a placeholder key meant a
 * misconfigured deployment looked healthy until a customer clicked "Upgrade"
 * and got an opaque Stripe error. Failing here instead keeps the problem on
 * the request that needs billing and leaves the rest of the app usable.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Billing is unavailable until it is set."
    );
  }
  if (!client) {
    client = new Stripe(secretKey, { apiVersion: "2025-03-31.basil" });
  }
  return client;
}

export type PlanConfig = {
  name: string;
  priceId: string | null;
  /** Events that may be created per calendar month. */
  monthlyEvents: number;
  /** Members with dashboard access, including the owner and pending invites. */
  seats: number;
  aiFlyer: boolean;
  /** Hide the "Powered by Eventful" badge on public pages. */
  removeBadge: boolean;
  /** Access to the analytics dashboard beyond the monthly quota meter. */
  analytics: boolean;
};

/**
 * Two tiers are sold, matching the pricing page: Free and Pro ($99/year).
 *
 * Seats count members plus unexpired invitations, so Free at 1 seat means the
 * owner alone — which is what makes "Team management" a Pro feature.
 */
export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    monthlyEvents: 5,
    seats: 1,
    aiFlyer: false,
    removeBadge: false,
    analytics: false,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    monthlyEvents: Number.POSITIVE_INFINITY,
    // Pro used to grant the same single seat as Free, which made the entire
    // invite flow unreachable for paying customers.
    seats: Number.POSITIVE_INFINITY,
    aiFlyer: true,
    removeBadge: true,
    analytics: true,
  },
} as const satisfies Record<string, PlanConfig>;

export type PlanKey = keyof typeof PLANS;

export function isPlanKey(value: string): value is PlanKey {
  return value in PLANS;
}

/**
 * Resolve a tenant's plan to its limits.
 *
 * ENTERPRISE is not sold self-serve — there is no price, pricing card, or
 * checkout path for it. It survives as a manual override for one-off custom
 * deals, set through the superadmin endpoint, and resolves to Pro's limits.
 * It must not fall through to FREE: doing so silently served free-tier limits
 * to tenants who had been granted more.
 */
export function getPlanConfig(plan: string): PlanConfig {
  if (isPlanKey(plan)) return PLANS[plan];
  if (plan === "ENTERPRISE") return { ...PLANS.PRO, name: "Enterprise" };
  return PLANS.FREE;
}

export type PlanFeature = "aiFlyer" | "removeBadge" | "analytics";

export function hasFeature(plan: string, feature: PlanFeature): boolean {
  return getPlanConfig(plan)[feature];
}
