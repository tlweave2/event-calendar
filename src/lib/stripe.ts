import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
});

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