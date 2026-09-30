import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
});

export { PLANS, getPlanConfig, hasFeature, type PlanKey } from "@/lib/plans";
