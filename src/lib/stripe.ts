import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-03-31.basil",
});

export const PLANS = {
  FREE: {
    name: "Free",
    priceId: null,
    monthlyEvents: 25,
    adminUsers: 1,
    customDomain: false,
    apiAccess: false,
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    monthlyEvents: Infinity,
    adminUsers: 5,
    customDomain: true,
    apiAccess: true,
  },
} as const;