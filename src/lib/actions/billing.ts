"use server";

import { auth } from "@/lib/auth";
import { getProPriceId, stripe } from "@/lib/stripe";
import type { BillingInterval } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isDemoTenant } from "@/lib/demo-guard";

export async function createCheckoutSession(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });
  if (!tenant) return;
  if (isDemoTenant(tenant.id, tenant.slug)) {
    redirect("/admin/settings?demo=1");
  }

  const interval: BillingInterval =
    formData.get("interval") === "monthly" ? "monthly" : "yearly";

  // Surface a real message rather than handing Stripe an empty price id.
  const priceId = getProPriceId(interval);
  if (!priceId) {
    console.error(`[billing] no Stripe price configured for ${interval}`);
    redirect("/admin/settings?billing_error=not_configured");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      tenantId: tenant.id,
    },
    customer_email: session.user.email ?? undefined,
    success_url: `${baseUrl}/admin/settings?upgraded=1`,
    cancel_url: `${baseUrl}/admin/settings?cancelled=1`,
  });

  if (!checkoutSession.url) return;

  redirect(checkoutSession.url);
}

export async function createPortalSession(formData: FormData): Promise<void> {
  void formData;
  const session = await auth();
  if (!session) return;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
  });

  if (!tenant?.stripeCustomerId) return;
  if (isDemoTenant(tenant.id, tenant.slug)) {
    redirect("/admin/settings?demo=1");
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${baseUrl}/admin/settings`,
  });

  redirect(portalSession.url);
}