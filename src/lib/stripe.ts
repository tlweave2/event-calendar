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
  removeBadge: boolean;
  customDomain: boolean;
  webhooks: boolean;
};

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    monthlyEvents: 5,
    seats: 1,
    aiFlyer: false,
    removeBadge: false,
    customDomain: false,
    webhooks: false,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    monthlyEvents: Number.POSITIVE_INFINITY,
    // Pro used to grant the same single seat as Free, which made the entire
    // invite flow unreachable for paying customers.
    seats: 5,
    aiFlyer: true,
    removeBadge: true,
    customDomain: true,
    webhooks: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? null,
    monthlyEvents: Number.POSITIVE_INFINITY,
    seats: Number.POSITIVE_INFINITY,
    aiFlyer: true,
    removeBadge: true,
    customDomain: true,
    webhooks: true,
  },
} as const satisfies Record<string, PlanConfig>;

export type PlanKey = keyof typeof PLANS;

export function isPlanKey(value: string): value is PlanKey {
  return value in PLANS;
}

/**
 * ENTERPRISE previously had no entry here and silently fell through to FREE,
 * so enterprise tenants were served free-tier limits.
 */
export function getPlanConfig(plan: string): PlanConfig {
  return isPlanKey(plan) ? PLANS[plan] : PLANS.FREE;
}

export type PlanFeature = "aiFlyer" | "removeBadge" | "customDomain" | "webhooks";

export function hasFeature(plan: string, feature: PlanFeature): boolean {
  return getPlanConfig(plan)[feature];
}
