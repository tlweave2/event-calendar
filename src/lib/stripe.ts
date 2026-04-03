import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";

function createUnavailableStripe(): Stripe {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("STRIPE_SECRET_KEY is not set");
      },
    }
  ) as Stripe;
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-03-31.basil",
    })
  : createUnavailableStripe();

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